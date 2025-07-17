
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Please add a product category']
    },
    description: {
        type: String
    },
    imageUrl: {
        type: String
    },
    specs: {
        type: Map,
        of: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;