const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  category: String,
  quantity: Number,
  minThreshold: Number,
  price: Number
});

module.exports = mongoose.model('Item', itemSchema);
