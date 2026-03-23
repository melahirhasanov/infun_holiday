const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token tapılmadı' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('category');
    if (!user) return res.status(401).json({ message: 'İstifadəçi tapılmadı' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token etibarsızdır' });
  }
};

const authorizedOnly = (req, res, next) => {
  if (req.user.role !== 'authorized') {
    return res.status(403).json({ message: 'Bu əməliyyat üçün səlahiyyətiniz yoxdur' });
  }
  next();
};

module.exports = { auth, authorizedOnly };