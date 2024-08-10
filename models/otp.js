const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: { type: String, required: true, index: true }, // Add index on email
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true, index: { expires: '20m' } } // Add TTL index to automatically delete expired OTPs
});

module.exports = mongoose.model('Otp', otpSchema);
