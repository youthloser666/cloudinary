const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqjrd00yu',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Serve static frontend files (index.html, style.css, js/, cube files, etc.)
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname)));

// ========== PHOTO API ROUTES (CRUD) ==========

// CREATE: Save photo to database
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

// READ: Get all photos (newest first)
app.get('/api/photos', async (req, res) => {
  try {
    const photos = await prisma.photo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, photos });
  } catch (error) {
    console.error('[Database Error] Failed to fetch photos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch photos.',
      details: error.message
    });
  }
});

// UPDATE: Update photo (username)
app.put('/api/photos/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required.' });
  }

  try {
    const photo = await prisma.photo.update({
      where: { id },
      data: { username: String(username).trim() }
    });
    console.log(`[Success] Photo updated: ${photo.id}`);
    return res.json({ success: true, photo });
  } catch (error) {
    console.error('[Database Error] Failed to update photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update photo.',
      details: error.message
    });
  }
});

// DELETE: Delete photo
app.delete('/api/photos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.photo.delete({ where: { id } });
    console.log(`[Success] Photo deleted: ${id}`);
    return res.json({ success: true, message: 'Photo deleted.' });
  } catch (error) {
    console.error('[Database Error] Failed to delete photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete photo.',
      details: error.message
    });
  }
});

// ========== CUBE FILTER API ROUTES ==========

// READ: Get all custom cube filters
app.get('/api/cubes', async (req, res) => {
  try {
    const cubes = await prisma.cubeFilter.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, cubes });
  } catch (error) {
    console.error('[Database Error] Failed to fetch cubes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cube filters.',
      details: error.message
    });
  }
});

// CREATE: Save cube filter to database
app.post('/api/cubes', async (req, res) => {
  const { name, emoji, fileName, cloudUrl } = req.body;

  if (!name || !fileName || !cloudUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, fileName, and cloudUrl are required.'
    });
  }

  try {
    const cube = await prisma.cubeFilter.create({
      data: {
        name: String(name).trim(),
        emoji: String(emoji || '🎨').trim(),
        fileName: String(fileName).trim(),
        cloudUrl: String(cloudUrl).trim(),
      }
    });

    console.log(`[Success] Cube filter saved: ${cube.id} - ${cube.name}`);
    return res.status(201).json({ success: true, cube });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'A cube filter with this filename already exists.'
      });
    }
    console.error('[Database Error] Failed to save cube:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save cube filter.',
      details: error.message
    });
  }
});

// DELETE: Delete cube filter (from DB and Cloudinary)
app.delete('/api/cubes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Find the cube filter by ID or fileName
    const cube = await prisma.cubeFilter.findFirst({
      where: {
        OR: [
          { id: id },
          { fileName: id }
        ]
      }
    });

    if (!cube) {
      return res.status(404).json({
        success: false,
        error: 'Cube filter not found in database.'
      });
    }

    // 2. Delete raw asset from Cloudinary
    const publicId = cube.fileName.replace(/\.cube$/i, '');
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        await cloudinary.uploader.destroy(cube.fileName, { resource_type: 'raw' });
        console.log(`[Cloudinary Success] Destroyed raw asset: ${publicId}`);
      } catch (cloudErr) {
        console.warn(`[Cloudinary Warning] Could not delete ${publicId} from Cloudinary:`, cloudErr.message);
      }
    } else {
      console.warn(`[Cloudinary Notice] Cloudinary API credentials not set in environment, skipped Cloudinary deletion.`);
    }

    // 3. Delete record from Prisma DB
    await prisma.cubeFilter.delete({
      where: { id: cube.id }
    });

    console.log(`[Success] Cube filter deleted: ${cube.id} (${cube.name})`);
    return res.json({
      success: true,
      message: `Cube filter '${cube.name}' deleted successfully.`
    });
  } catch (error) {
    console.error('[Database Error] Failed to delete cube filter:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete cube filter.',
      details: error.message
    });
  }
});

// ========== CONFIG & STATIC ROUTES ==========

// API Route: Get Cloudinary configuration
app.get('/api/config/cloudinary', (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dqjrd00yu',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'mfwcupload'
  });
});

// Serve frontend on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server for local execution
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
