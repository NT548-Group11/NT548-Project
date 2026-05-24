const mongoose = require('mongoose');

const blogCatSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        index: true,
        required: true,
    },
}, {
    timestamps: true,
}
);

module.exports = mongoose.model('BlogCategory', blogCatSchema);