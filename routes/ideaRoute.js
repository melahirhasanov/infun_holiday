const express = require('express');
const router = express.Router();
const { auth, authorizedOnly } = require('../middleware/auth');
const { upload } = require('../config/clauinary');
const Idea = require('../models/İdea');
const User = require('../models/User');

// Create idea (auth required)
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { title, description, requirements, categoryId } = req.body;

    const media = (req.files || []).map(f => ({
      url: f.path,
      type: f.mimetype.startsWith('video/') ? 'video' : 'image',
      publicId: f.filename
    }));

    const idea = await Idea.create({
      title,
      description,
      requirements,
      category: categoryId,
      creator: req.user._id,
      media
    });

    const populated = await Idea.findById(idea._id)
      .populate('creator', 'name role')
      .populate('category');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all ideas (with filters)
router.get('/', auth, async (req, res) => {
  try {
    const { category, mine, all } = req.query;
    const filter = {};

    if (mine === 'true') {
      // Öz ideyaları — authorized da daxil
      filter.creator = req.user._id;
    } else if (req.user.role === 'authorized' && !all) {
      // Authorized öz kateqoriyasının ideyalarını görür
      filter.category = req.user.category?._id;
      if (category) filter.category = category; // manual override
    } else {
      // Hamısı (all=true) və ya adi user
      if (category) filter.category = category;
    }

    const ideas = await Idea.find(filter)
      .populate('creator', 'name role email phone')
      .populate('category')
      .populate('participants', 'name')
      .sort({ createdAt: -1 });

    res.json(ideas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single idea
router.get('/:id', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('creator', 'name role email phone')
      .populate('category')
      .populate('participants', 'name')
      .populate('likes', 'name')
      .populate('comments.user', 'name role');
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });
    res.json(idea);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like/unlike idea
router.post('/:id/like', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const userId = req.user._id.toString();
    const idx = idea.likes.findIndex(id => id.toString() === userId);
    if (idx === -1) {
      idea.likes.push(req.user._id);
    } else {
      idea.likes.splice(idx, 1);
    }
    await idea.save();
    res.json({ likes: idea.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join idea as participant
router.post('/:id/join', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const idx = idea.participants.findIndex(p => p.toString() === req.user._id.toString());
    if (idx === -1) {
      idea.participants.push(req.user._id);
    } else {
      idea.participants.splice(idx, 1);
    }
    await idea.save();
    const updated = await Idea.findById(idea._id).populate('participants', 'name');
    res.json({ participants: updated.participants, joined: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    idea.comments.push({ user: req.user._id, text });
    await idea.save();

    const authorizedUser = await User.findOne({ category: idea.category, role: 'authorized' });

    const updated = await Idea.findById(idea._id)
      .populate('comments.user', 'name role');

    res.json({
      comments: updated.comments,
      categoryContact: authorizedUser ? {
        name: authorizedUser.name,
        email: authorizedUser.email,
        phone: authorizedUser.phone
      } : null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update idea (owner or authorized)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { title, description, requirements } = req.body;
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const isOwner = idea.creator.toString() === req.user._id.toString();
    const isAuthorized = req.user.role === 'authorized';
    if (!isOwner && !isAuthorized)
      return res.status(403).json({ message: 'Redaktə etmək üçün icazəniz yoxdur' });

    if (title) idea.title = title;
    if (description) idea.description = description;
    if (requirements !== undefined) idea.requirements = requirements;

    await idea.save();
    res.json({ title: idea.title, description: idea.description, requirements: idea.requirements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update status (authorized only, for their category)
router.patch('/:id/status', auth, authorizedOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'in_progress', 'done'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Yanlış status' });

    const idea = await Idea.findById(req.params.id).populate('category');
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    // Authorized can update any category's idea status
    idea.status = status;
    await idea.save();

    res.json({ status: idea.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get category contact info
router.get('/:id/contact', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const authorizedUser = await User.findOne({ category: idea.category, role: 'authorized' });
    if (!authorizedUser)
      return res.json({ contact: null });

    res.json({
      contact: {
        name: authorizedUser.name,
        email: authorizedUser.email,
        phone: authorizedUser.phone
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// Add media to existing idea
router.post('/:id/media', auth, upload.array('media', 5), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const isOwner = idea.creator.toString() === req.user._id.toString();
    const isAuthorized = req.user.role === 'authorized';
    if (!isOwner && !isAuthorized)
      return res.status(403).json({ message: 'İcazəniz yoxdur' });

    const totalAfter = idea.media.length + (req.files?.length || 0);
    if (totalAfter > 10)
      return res.status(400).json({ message: 'Maksimum 10 media faylı ola bilər' });

    const newMedia = (req.files || []).map(f => ({
      url: f.path,
      type: f.mimetype.startsWith('video/') ? 'video' : 'image',
      publicId: f.filename
    }));

    idea.media.push(...newMedia);
    await idea.save();
    res.json({ media: idea.media });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete single media from idea
router.delete('/:id/media/:mediaIndex', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'İdeya tapılmadı' });

    const isOwner = idea.creator.toString() === req.user._id.toString();
    const isAuthorized = req.user.role === 'authorized';
    if (!isOwner && !isAuthorized)
      return res.status(403).json({ message: 'İcazəniz yoxdur' });

    const idx = parseInt(req.params.mediaIndex);
    if (isNaN(idx) || idx < 0 || idx >= idea.media.length)
      return res.status(400).json({ message: 'Yanlış media indeksi' });

    const removed = idea.media[idx];

    // Delete from Cloudinary
    if (removed.publicId) {
      try {
        const { cloudinary } = require('../config/cloudinary');
        await cloudinary.uploader.destroy(removed.publicId, {
          resource_type: removed.type === 'video' ? 'video' : 'image'
        });
      } catch (e) {
        console.warn('Cloudinary silmə xətası:', e.message);
      }
    }

    idea.media.splice(idx, 1);
    await idea.save();
    res.json({ media: idea.media });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});