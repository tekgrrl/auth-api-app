const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, required: true }, // verify or signin
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // Token expires after 1 hour
  expires: { type: Date },
});

module.exports = mongoose.model("Token", tokenSchema);
