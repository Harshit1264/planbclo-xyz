const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user');
const Order = require('../models/order');
const Promo = require('../models/promoCode'); 

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Apply promo code
router.post('/apply-promo', authenticateToken, async (req, res) => {
    const { promoCode } = req.body;

    try {
        // Find the promo code in the database
        const promo = await Promo.findOne({ code: promoCode });

        if (!promo) {
            return res.status(400).json({ error: 'Invalid promo code' });
        }

        // Return the discount value
        res.status(200).json({ discount: promo.discount });
    } catch (error) {
        console.error('Error applying promo code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create an Order
router.post('/create-order', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user || user.cart.length === 0) {
            return res.status(400).send({ error: 'Your cart is empty' });
        }

        let subtotal = 0;
        user.cart.forEach(item => {
            subtotal += item.product.price * item.quantity;
        });
        //calculation tax
        subtotal = Math.round((subtotal*118)/100)+70;

        const options = {
            amount: subtotal * 100, // amount in the smallest currency unit
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.send({
            orderId: order.id,
            amount: subtotal,
            currency: "INR",
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send({ error: error.message });
    }
});

// Success Route for Payment
router.post('/success', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // Validate cart items
        const validCartItems = user.cart.filter(item => item.product);
        if (validCartItems.length === 0) {
            return res.status(400).send({ error: 'No valid products in cart' });
        }

        // Calculate the total cost of the order
        const total = validCartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

        // Create new order with user's cart items
        const newOrder = new Order({
            user: user._id,
            products: validCartItems.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                size: item.size,
                color: item.color
            })),
            total
        });

        // Clear user's cart after placing order
        user.cart = [];
        await user.save();
        await newOrder.save();

        // Send response back with the new order details
        res.status(201).send({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;