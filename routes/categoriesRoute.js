const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Validate role code
router.post('/validate-role', async (req, res) => {
  try {
    const { roleCode } = req.body;
    const category = await Category.findOne({ roleCode });
    if (!category)
      return res.status(404).json({ valid: false, message: 'Rol kodu tapılmadı' });
    res.json({ valid: true, category });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;