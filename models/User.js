const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, default: null },
  phone:    { type: String, default: null },
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

mongoose.connection.once('open', async () => {
  try {
    await User.collection.dropIndex('username_1');
    console.log('[migration] username_1 index silindi');
  } catch { /* yoxdursa ignore et */ }

  try {
    await User.collection.dropIndex('email_1');
    console.log('[migration] email_1 index silindi');
  } catch { /* yoxdursa ignore et */ }
});

module.exports = User;