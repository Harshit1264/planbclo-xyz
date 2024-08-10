const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');

router.post('/update-status/:orderId', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/admin/orders');
        }

        order.updateStatus(status);
        req.flash('success_msg', 'Order status updated successfully');
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error_msg', 'Error updating order status');
        res.redirect('/admin/orders');
    }
});

router.post('/order', authenticateToken, async (req, res) => {
    try {
        // Find user by ID and populate the cart products
        const user = await User.findById(req.user.id).populate('cart.product');

        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        if (!user.cart || user.cart.length === 0) {
            return res.status(400).send({ error: 'Cart is empty' });
        }

        // Calculate the total cost of the order
        const total = user.cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

        // Create new order with user's cart items
        const newOrder = new Order({
            user: user._id,
            products: user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity
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

// Get User Orders Route
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('products.product');
        res.render('profile', { user: req.user, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ error: error.message });
    }
});

// Get All Orders (Admin) Route
router.get('/admin/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('user products.product');
        res.render('admin-orders', { user: req.user, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
