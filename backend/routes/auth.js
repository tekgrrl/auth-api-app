const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Token = require("../models/Token");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: envFile });

const JWT_SECRET = process.env.JWT_SECRET;
const SIGNIN_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const emailUser = process.env.SMTP_USER;

// Create the transporter with the required configuration for Ethereal
// TODO: Allow it to create a test account if the provide credentials are invalid
// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   auth: {
//     user: process.env.ETHEREAL_USER,
//     pass: process.env.ETHEREAL_PASS,
//   },
// });

async function getAccessToken(clientId, clientSecret, refreshToken) {
  const url = "https://oauth2.googleapis.com/token";
  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    redirect_uri: "https://developers.google.com/oauthplayground", // Match the redirect URI used initially
  };

  try {
    const response = await axios.post(url, params);
    console.log("Access Token:", response.data.access_token);
    return response.data.access_token; // You might also want to return the entire response.data object
  } catch (error) {
    console.error("Failed to refresh access token:", error.response.data);
    return null;
  }
}

// Function to create a mail transporter
async function createTransporter() {
  const accessToken = await getAccessToken(
    clientId,
    clientSecret,
    refreshToken
  );
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: emailUser,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken,
    },
  });
}

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (code) {
    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "http://localhost:8000/callback",
        grant_type: "authorization_code",
      });
      const tokens = response.data;
      // Store these tokens securely
      console.log("Access Token:", tokens.access_token);
      console.log("Refresh Token:", tokens.refresh_token);

      res.send("Tokens received.");
    } catch (error) {
      console.error("Token exchange failed:", error.response.data);
      res.status(500).send("Failed to exchange the code for tokens.");
    }
  } else {
    res.status(400).send("No code received.");
  }
});

// Request signin link endpoint
router.post("/request-signin", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email, verified: true });

    if (!user) {
      // TODO: Seperate error handling for user not found and user not verified
      return res.status(400).json({ error: "User not found or not verified" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const signinLink = `http://localhost:3001/auth/signin?token=${token}`;

    await Token.create({
      token,
      email,
      type: "signin",
      expires: new Date(Date.now() + SIGNIN_TOKEN_EXPIRY),
    });

    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"Your App" <noreply@yourapp.com>',
      to: email,
      subject: "Sign in to Your App",
      text: `Click this link to sign in: ${signinLink}`,
      html: `<p>Click <a href="${signinLink}">here</a> to sign in.</p>`,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({ message: "Signin link sent successfully" });
  } catch (error) {
    console.error("Error in request-signin:", error);
    res.status(500).json({ error: "Failed to process signin request" });
  }
});

// Signin endpoint
router.get("/signin", async (req, res) => {
  const { token } = req.query;

  try {
    const signinToken = await Token.findOne({
      token,
      type: "signin",
      expires: { $gt: new Date() },
    });

    if (!signinToken) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await Token.deleteOne({ _id: signinToken._id });

    const jwtToken = jwt.sign({ email: signinToken.email }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // res.json({ token: jwtToken }); // TODO: Remove this line
    // Redirect to the frontend's auth page with the JWT token
    res.redirect(`http://localhost:3000/api/auth?token=${jwtToken}`);
  } catch (error) {
    console.error("Error in signin:", error);
    res.status(500).json({ error: "Failed to process signin" });
  }
});

// Protected route example
router.get("/protected", authenticateToken, (req, res) => {
  res.json({ message: "Access granted to protected route", user: req.user });
});

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newUser = new User({ email });
    await newUser.save();

    const token = crypto.randomBytes(32).toString("hex");
    const newToken = new Token({
      token,
      email,
      type: "verify",
      expires: new Date(Date.now() + SIGNIN_TOKEN_EXPIRY),
    });
    await newToken.save();

    const verificationLink = `http://localhost:3001/auth/verify?token=${token}`;
    const mailOptions = {
      from: "noreply@yourdomain.com",
      to: email,
      subject: "Verify your email",
      text: `Click this link to verify your email: ${verificationLink}`,
    };

    const transporter = await createTransporter();
    let info = await transporter.sendMail(mailOptions);

    console.log("Verification email sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.json({
      message:
        "Signup successful. Please check your email to verify your account.",
      previewUrl: nodemailer.getTestMessageUrl(info),
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "An error occurred during signup" });
  }
});

// Verify email route
router.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    const verificationToken = await Token.findOne({ token });
    if (!verificationToken && verificationToken.type !== "verify") {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = await User.findOne({ email: verificationToken.email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    user.verified = true;
    await user.save();

    await Token.deleteOne({ _id: verificationToken._id });

    res.json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "An error occurred during verification" });
  }
});

module.exports = router;
