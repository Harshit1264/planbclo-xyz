const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  mobile: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, index: true }, // Added index for faster queries
  password: { type: String },
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: String },
  otp: { type: String },
  otpExpiresAt: { type: Date },
  role: { type: String, default: 'user' },
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true }
  }]
});



module.exports = mongoose.model('User', userSchema);
