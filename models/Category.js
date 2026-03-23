const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  roleCode: { type: String, required: true, unique: true },
  responsibles: [{ type: String }], // responsible person names
  color: { type: String, default: '#2563eb' },
  icon: { type: String, default: '💡' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);