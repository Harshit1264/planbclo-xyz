const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.get('/products', async (req, res) => {
    try {
        const { search, color, size, category, subcategory, ...filters } = req.query;

        let query = {};

        // Build the query object with filters
        if (color) {
            query.color = color;
        }
        if (size) {
            query.size = size;
        }
        if (category) {
            query.category = category;
        }
        if (subcategory) {
            query.subcategory = subcategory;
        }

        // Add search conditions for name, description, category, subcategory, color, and size
        if (search) {
            const normalizedSearch = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();
            query.$or = [
                { name: { $regex: normalizedSearch, $options: 'i' } },
                { description: { $regex: normalizedSearch, $options: 'i' } },
                { category: { $regex: normalizedSearch, $options: 'i' } },
                { subcategory: { $regex: normalizedSearch, $options: 'i' } },
                { color: { $regex: normalizedSearch, $options: 'i' } },
                { size: { $regex: normalizedSearch, $options: 'i' } }
            ];
        }

        // Add any additional filters that might be present
        for (const key in filters) {
            if (filters[key]) {
                query[key] = filters[key];
            }
        }

        console.log('Received filters and search query:', JSON.stringify(query, null, 2)); // Better logging

        // Execute the query
        const products = await Product.find(query);
        console.log('Products found:', products); // Log the results

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
});




// Fetch a single product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
