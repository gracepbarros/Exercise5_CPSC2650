const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: String,
    id: String,
    name: String,
});

module.exports = mongoose.model('Movie', movieSchema);
