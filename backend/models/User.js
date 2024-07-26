const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  verified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
