const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Models
const Token = require("./models/Token");
const User = require("./models/User");

// Routes
const authRoutes = require("./routes/auth");

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: envFile });

console.log(`env file: ${envFile}`);
console.log(`DB_URI: ${process.env.DB_URI}`);
console.log(`ETHEREAL_USER: ${process.env.ETHEREAL_USER}`);
console.log(`ETHEREAL_PASS: ${process.env.ETHEREAL_PASS}`);

const app = express();
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use auth routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;
server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
