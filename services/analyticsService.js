const Item = require('../models/Item');

const getCategoryWiseStock = async () => {
  return await Item.aggregate([
    { $group: { 
      _id: '$category', 
      totalQuantity: { $sum: '$quantity' } 
    }},
    { $sort: { totalQuantity: -1 } }
  ]);
};

const getLowStockItems = async () => {
  return await Item.find({ quantity: { $lt: '$minThreshold' } });
};

module.exports = { getCategoryWiseStock, getLowStockItems };
