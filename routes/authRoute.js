const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const { auth } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Normal user register
router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password)
      return res.status(400).json({ message: 'Ad və şifrə tələb olunur' });

    const exists = await User.findOne({ name });
    if (exists)
      return res.status(400).json({ message: 'Bu ad artıq istifadə olunur' });

    const user = await User.create({ name, password, role: 'user' });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        category: null
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Authorized user register (with role code)
router.post('/register-authorized', async (req, res) => {
  try {
    const { name, password, phone, email, roleCode } = req.body;
    if (!name || !password || !phone || !email || !roleCode)
      return res.status(400).json({ message: 'Bütün sahələr tələb olunur' });

    const category = await Category.findOne({ roleCode });
    if (!category)
      return res.status(400).json({ message: 'Rol kodu yanlışdır' });

    const exists = await User.findOne({ name });
    if (exists)
      return res.status(400).json({ message: 'Bu ad artıq istifadə olunur' });

    // Check if authorized user already exists for this category
    const existingAuth = await User.findOne({ category: category._id, role: 'authorized' });
    if (existingAuth)
      return res.status(400).json({ message: 'Bu kateqoriya üçün artıq səlahiyyətli şəxs mövcuddur' });

    const user = await User.create({
      name,
      password,
      phone,
      email,
      role: 'authorized',
      category: category._id
    });

    const token = generateToken(user._id);
    const populated = await User.findById(user._id).populate('category');

    res.status(201).json({
      token,
      user: {
        _id: populated._id,
        name: populated.name,
        role: populated.role,
        phone: populated.phone,
        email: populated.email,
        category: populated.category
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name }).populate('category');
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Ad və ya şifrə yanlışdır' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        category: user.category
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('category');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      category: user.category
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;