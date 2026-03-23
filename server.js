const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://infaq-ramadan.netlify.app', // öz Netlify URL-ini yaz
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/ideas', require('./routes/ideaRoute'));
app.use('/api/categories', require('./routes/categoriesRoute'));

// Connect to MongoDB
mongoose.connect(process.env.DB_URL)
  .then(() => {
    console.log('✅ MongoDB connected');
    require('./utils/seeder')();
  })
  .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));