const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    size: { type: String, required: true },
    color: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [cartItemSchema],
    total: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' }
});

// Index the user field for faster lookups
orderSchema.index({ user: 1 });

orderSchema.methods.updateStatus = async function (status) {
    this.status = status;
    await this.save();
    return this;
};

module.exports = mongoose.model('Order', orderSchema);
