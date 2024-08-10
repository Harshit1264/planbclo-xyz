const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');
const Promo = require('../models/promoCode'); 

const upload = require('../config/multer');

const s3 = require('../config/s3');
const { authenticateToken, optionalAuthenticateToken, authorizeAdmin } = require('../middleware/auth');

// Predefined categories and subcategories
const categories = {
    Men: ['T-shirts', 'Shirts', 'Trousers', 'Pants', 'Jeans', 'Outerwear', 'Suits', 'Activewear'],
    Women: ['T-shirts', 'Blouses', 'Trousers', 'Pants', 'Jeans', 'Dresses', 'Skirts', 'Outerwear', 'Activewear', 'Lingerie'],
    Kids: ['T-shirts', 'Shirts', 'Trousers', 'Pants', 'Jeans', 'Dresses', 'Skirts', 'Outerwear', 'Activewear', 'School Uniforms']
};

// Route to render the add product page
// router.get('/add-product', optionalAuthenticateToken, authorizeAdmin, (req, res) => {
//     res.render('admin-add-products', { user: req.user });
// });

// Route to handle the form submission
// router.post('/add-product', authenticateToken, authorizeAdmin, async (req, res) => {
//     const { name, description, price, imageUrls, category, subcategory, stock, sizes, colors, material, brand } = req.body;

//     const product = new Product({
//         name,
//         description,
//         price,
//         imageUrls,
//         category,
//         subcategory,
//         stock,
//         sizes: Array.isArray(sizes) ? sizes : sizes.split(',').map(size => size.trim()),
//         colors: Array.isArray(colors) ? colors : colors.split(',').map(color => color.trim()),
//         material,
//         brand
//     });

//     try {
//         await product.save();
//         res.status(200).json({ message: 'Product added successfully' });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// Update Order Status
router.post('/order/:id/status', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).send({ error: 'Order not found' });
        }

        order.status = req.body.status;
        await order.save();

        // Emit event to notify client about order status update
        req.app.get('io').to(order.user.toString()).emit('orderStatusUpdate', {
            orderId: order._id,
            status: order.status
        });

        res.send({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send({ error: error.message });
    }
});

// Get Users and their Orders
router.get('/users', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const users = await User.find().lean();
        const orders = await Order.find().lean();

        // Map orders to their respective users
        const userOrders = users.map(user => {
            const userOrderList = orders.filter(order => order.user.toString() === user._id.toString());
            const totalOrders = userOrderList.length;
            return { ...user, totalOrders };
        });

        // console.log('Fetched users:', userOrders); // Log fetched users

        res.render('users', { user: req.user, users: userOrders }); // Pass user and users data
    } catch (error) {
        // console.error('Error fetching users and orders:', error);
        res.status(500).send({ error: error.message });
    }
});


// Get all orders (Admin)
router.get('/admin/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('user products.product');
        res.render('admin-orders', { user: req.user, orders });
    } catch (error) {
        // console.error('Error fetching orders:', error);
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
        const io = req.app.get('io');
        io.to(order.user.toString()).emit('orderStatusUpdate', { orderId: order._id, status });

        req.flash('success_msg', 'Order status updated successfully');
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        req.flash('error_msg', 'Error updating order status');
        res.redirect('/admin/orders');
    }
});
// Route to delete a user
router.delete('/users/delete/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});
// Route to fetch all products
router.get('/add-product', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const products = await Product.find({});
        const promocodes = await Promo.find({});
        res.render('admin-add-products', { user: req.user, products , promocodes });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send({ error: error.message });
    }
});



// Utility function to upload file to Cloudinary

router.post('/add-product', authenticateToken, authorizeAdmin, upload.array('imageUrls', 5), async (req, res) => {
    try {
        console.log('Files:', req.files); // Log uploaded files
        console.log('Body:', req.body); // Log form body

        const imageUploadPromises = req.files.map(file => {
            const params = {
                Bucket: process.env.S3_BUCKET,
                Key: `${Date.now().toString()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            return s3.upload(params).promise();
        });

        const imageUploadResults = await Promise.all(imageUploadPromises);
        const imageUrls = imageUploadResults.map(result => result.Location);

        const { name, description, price, category, subcategory, stock, sizes, colors, material, brand } = req.body;

        const sizesArray = sizes.split(',').map(s => s.trim());
        const colorsArray = colors.split(',').map(c => c.trim());

        const newProduct = new Product({
            name,
            description,
            price,
            imageUrls,
            category,
            subcategory,
            stock,
            sizes: sizesArray,
            colors: colorsArray,
            material,
            brand
        });

        await newProduct.save();
        res.redirect('/admin/add-product'); // Redirect to the store page after successful addition
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: error.message });
    }
});







// Route to delete a product
router.delete('/products/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send({ error: error.message });
    }
});
router.post('/add-promo', authenticateToken, authorizeAdmin, async (req, res) => {
    const { promoCode, discount } = req.body;

    const promo = new Promo({
        code: promoCode,
        discount
    });

    try {
        await promo.save();
        // res.status(201).json({ message: 'Promo code added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a promo code
router.delete('/promocodes/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        await Promo.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Promo code deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;