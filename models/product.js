const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true, 
        maxlength: 100, 
        index: true // Index for faster search
    },
    description: { 
        type: String, 
        required: true, 
        trim: true 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    imageUrls: { 
        type: [String], 
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one image URL is required'
        }
    },
    category: { 
        type: String, 
        required: true, 
        trim: true, 
        enum: ['Men', 'Women', 'Winter-Collection'], 
        index: true // Index for faster search
    },
    subcategory: { 
        type: String, 
        required: true, 
        trim: true, 
        enum: [
            'T-shirts', 'Shirts', 'Trousers', 'Pants', 'Jeans', 
            'Outerwear', 'Suits', 'Activewear', 'Blouses', 'Dresses', 
            'Skirts', 'Lingerie', 'School Uniforms', 'Hoodies', 'Jackets',
            'Joggers'
        ] 
    },
    stock: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    sizes: { 
        type: [String], 
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Sizes array must contain at least one size'
        }
    },
    colors: { 
        type: [String], 
        required: true,
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Colors array must contain at least one color'
        }
    },
    material: { 
        type: String, 
        required: true, 
        trim: true 
    },
    brand: { 
        type: String, 
        required: true, 
        trim: true 
    }
});

module.exports = mongoose.model('Product', productSchema);
