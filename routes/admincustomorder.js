const express = require('express');
const router = express.Router();
const CustomOrder = require('../models/customOrder');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Get all custom orders
router.get('/admin/custom-orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const customOrders = await CustomOrder.find().populate('user');
        res.render('admin-custom-orders', { user: req.user,customOrders });
    } catch (error) {
        console.error('Error fetching custom orders:', error);
        req.flash('error_msg', 'Error fetching custom orders');
        res.redirect('/admin/custom-orders'); // Redirect to the same page to retry
    }
});

// Update custom order status
router.post('/admin/custom-orders/update/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedOrder = await CustomOrder.findByIdAndUpdate(id, { status }, { new: true });
        
        if (!updatedOrder) {
            req.flash('error_msg', 'Custom order not found');
            return res.redirect('/admin/custom-orders');
        }
        
        req.flash('success_msg', 'Order status updated successfully');
        res.redirect('/admin/custom-orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error_msg', 'Error updating order status');
        res.redirect('/admin/custom-orders');
    }
});

// Delete custom order
router.post('/admin/custom-orders/delete/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await CustomOrder.findByIdAndDelete(id);
        
        if (!deletedOrder) {
            req.flash('error_msg', 'Custom order not found');
            return res.redirect('/admin/custom-orders');
        }
        
        req.flash('success_msg', 'Order deleted successfully');
        res.redirect('/admin/custom-orders');
    } catch (error) {
        console.error('Error deleting order:', error);
        req.flash('error_msg', 'Error deleting order');
        res.redirect('/admin/custom-orders');
    }
});

module.exports = router;
