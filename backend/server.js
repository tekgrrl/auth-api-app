const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Models
const Token = require("./models/Token");
const User = require("./models/User");

// Routes
const authRoutes = require("./routes/auth");

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
dotenv.config({ path: envFile });

const app = express();
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Use CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow only your frontend to access the backend
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific methods if needed
    credentials: true, // Enable cookies and other credentials if needed
  })
);

// Use auth routes
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 3000;
server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
