const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderCode: { type: Number, unique: true }, 
    products:[
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
            price: Number
        },
    ],
    paymentIntend: {},
    orderStatus: {
        type: String,
        default: 'Not Processed',
        enum: ['Not Processed', 'Processing','Paid', 'Cash on Delivery', 'Shipped', 'Delivered', 'Cancelled'],
    },
    orderBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    totalAmount: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
