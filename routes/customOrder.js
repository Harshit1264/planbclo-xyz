// routes/customOrder.js
const express = require('express');
const router = express.Router();
const CustomOrder = require('../models/customOrder');
const User = require('../models/user');
const { authenticateToken } = require('../middleware/auth'); // Using authenticateToken for secure access

// Route to display the form and fetch previous custom orders
router.get('/create-custom-order', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        console.log('User:', user); 
        const customOrders = await CustomOrder.find({ user: user._id });

        res.render('create-custom-order', {
            user,
            customOrders
        });
    } catch (error) {
        console.error('Error fetching custom orders:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle form submission
router.post('/create-custom-order', authenticateToken, async (req, res) => {
    try {
        const { clothingType, color, size, description } = req.body;
        const user = req.user;

        const newCustomOrder = new CustomOrder({
            user: user._id,
            clothingType,
            color,
            size,
            description
        });

        await newCustomOrder.save();
        res.redirect('/profile');
    } catch (error) {
        console.error('Error creating custom order:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
