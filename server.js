const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files (index.html, cube files, etc.)
app.use(express.static(path.join(__dirname)));

// API Route: Save photo to database
app.post('/api/photos', async (req, res) => {
  const { username, originalUrl, finalUrl, filterName } = req.body;

  // Validation
  if (!username || !originalUrl || !finalUrl || !filterName) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: username, originalUrl, finalUrl, and filterName are all required.'
    });
  }

  try {
    const photo = await prisma.photo.create({
      data: {
        username: String(username).trim(),
        originalUrl: String(originalUrl).trim(),
        finalUrl: String(finalUrl).trim(),
        filterName: String(filterName).trim(),
      }
    });

    console.log(`[Success] Photo saved: ${photo.id} by ${photo.username}`);
    return res.status(201).json({
      success: true,
      message: 'Photo saved successfully!',
      photo
    });
  } catch (error) {
    console.error('[Database Error] Failed to save photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error. Failed to save photo to gallery.',
      details: error.message
    });
  }
});

// API Route: Get Cloudinary configuration
app.get('/api/config/cloudinary', (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dqjrd00yu',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'mfwc_upload'
  });
});

// Serve frontend on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`📸 Disposable Camera Backend is running!`);
  console.log(`🚀 Server URL: http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`==================================================`);
});
