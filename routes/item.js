const express = require('express');
const Item = require('../models/Item');
const router = express.Router();

router.get('/', async (req, res) => {
  const items = await Item.find();
  res.json({ items });
});

router.post('/', async (req, res) => {
  const item = new Item(req.body);
  await item.save();
  res.json(item);
});

module.exports = router;
