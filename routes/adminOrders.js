const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const Order = require('../models/order');

// Get all orders (Admin)
router.get('/admin/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('user products.product');
        res.render('admin-orders', { user: req.user, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send({ error: error.message });
    }
});

// Update order status (Admin)
router.post('/admin/orders/update-status/:orderId', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            req.flash('error_msg', 'Order not found');
            return res.redirect('/admin/orders');
        }

        order.status = status;
        await order.save();

        // Emit status update to user
        req.io.to(order.user.toString()).emit('orderStatusUpdate', { orderId: order._id, status });

        req.flash('success_msg', 'Order status updated successfully');
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error_msg', 'Error updating order status');
        res.redirect('/admin/orders');
    }
});


module.exports = router;