const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomOrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clothingType: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

// Index the user field for faster lookups
CustomOrderSchema.index({ user: 1 });

module.exports = mongoose.model('CustomOrder', CustomOrderSchema);
