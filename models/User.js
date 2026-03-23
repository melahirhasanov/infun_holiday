const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, sparse: true, default: null },
  phone:    { type: String, sparse: true, default: null },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'authorized'],
    default: 'user'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  avatar: { type: String, default: null }
}, { timestamps: true });

// Köhnə username index-ini avtomatik sil (migration)
userSchema.on('index', function (err) {
  if (err) console.error('User index error:', err);
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

// Köhnə username_1 indexini sil
User.collection.dropIndex('username_1').catch(() => {
  // index artıq yoxdursa ignore et
});

module.exports = User;