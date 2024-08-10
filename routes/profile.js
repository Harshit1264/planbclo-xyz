const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user');
const Order = require('../models/order');
const CustomOrder = require('../models/customOrder'); // Assuming you have a CustomOrder model

// Get Profile Route
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const orders = await Order.find({ user: req.user.id }).populate('products.product');
        const customOrders = await CustomOrder.find({ user: req.user.id }); // Fetch custom orders
        res.render('profile', { user, orders, customOrders });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).send({ error: error.message });
    }
});

// Update Profile Route
router.post('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        user.firstname = req.body.firstname;
        user.lastname = req.body.lastname;
        user.mobile = req.body.mobile;
        user.address1 = req.body.address1;
        user.address2 = req.body.address2;
        user.city = req.body.city;
        user.state = req.body.state;
        user.country = req.body.country;
        user.pincode = req.body.pincode;

        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send({ error: error.message });
    }
});

module.exports = router;
