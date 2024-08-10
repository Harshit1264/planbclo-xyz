const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/user');
const Product = require('../models/product');
const Promo = require('../models/promoCode');  // Import the product model

// Add to Cart Route
router.post('/add', authenticateToken, async (req, res) => {
    const { productId, selectedColor, selectedSize } = req.body;
    console.log(productId, selectedColor, selectedSize);
    try {
        

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send({ error: 'Product not found' });
        }
       

        // Check if the product with the same color and size is already in the cart
        const cartItem = user.cart.find(item => item.product.toString() === productId && item.color === selectedColor && item.size === selectedSize);
        if (cartItem) {
            cartItem.quantity += 1; // Increment quantity if product is already in the cart
            console.log('Incremented quantity for existing product in cart');
        } else {
            user.cart.push({ product: productId, color: selectedColor, size: selectedSize, quantity: 1 });
            console.log('Added new product to cart');
        }

        await user.save();
        // console.log('User cart after adding product:', user.cart);
        res.status(200).send({ message: 'Product added to cart', cart: user.cart });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).send({ error: error.message });
    }
});
// Fetch Cart Route
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('cart.product');
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/');
        }

        let subtotal = 0;
        user.cart.forEach(item => {
            if (item.product) {
                subtotal += item.product.price * item.quantity;
            }
        });

        res.render('cart', { user, cart: user.cart, subtotal });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send({ error: error.message });
    }
});
// Remove Individual Item Route
router.post('/remove', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/cart');
        }

        const productId = req.body.productId;
        user.cart = user.cart.filter(item => item.product.toString() !== productId);
        await user.save();

        req.flash('success_msg', 'Item removed successfully');
        res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        req.flash('error_msg', 'Error removing item from cart');
        res.redirect('/cart');
    }
});


// Clear Cart Route
router.post('/clear', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        user.cart = [];
        await user.save();

        // res.status(200).send({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).send({ error: error.message });
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
router.post('/increase', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/cart');
        }

        const productId = req.body.productId;
        const item = user.cart.find(item => item.product.toString() === productId);
        if (item) {
            item.quantity += 1;
            await user.save();
            req.flash('success_msg', 'Quantity increased successfully');
        } else {
            req.flash('error_msg', 'Item not found in cart');
        }
        res.redirect('/cart');
    } catch (error) {
        console.error('Error increasing quantity:', error);
        req.flash('error_msg', 'Error increasing quantity');
        res.redirect('/cart');
    }
});
router.post('/decrease', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/cart');
        }

        const productId = req.body.productId;
        const item = user.cart.find(item => item.product.toString() === productId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
                await user.save();
                req.flash('success_msg', 'Quantity decreased successfully');
            } else {
                req.flash('error_msg', 'Cannot decrease quantity below 1');
            }
        } else {
            req.flash('error_msg', 'Item not found in cart');
        }
        res.redirect('/cart');
    } catch (error) {
        console.error('Error decreasing quantity:', error);
        req.flash('error_msg', 'Error decreasing quantity');
        res.redirect('/cart');
    }
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

module.exports = router;