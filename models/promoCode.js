const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true }
});

module.exports = mongoose.model('PromoCode', promoSchema);
