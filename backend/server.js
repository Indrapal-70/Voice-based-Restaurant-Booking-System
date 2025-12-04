const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// We look for environment variables in the project root
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

// Quick sanity check - let's see what environment variables the backend can find
console.log('Backend process cwd:', process.cwd());
console.log('Attempting to load env from:', envPath);
console.log('MONGODB_URL:', process.env.MONGODB_URL || '<not set>');
console.log('mongodb_url:', process.env.mongodb_url || '<not set>');

const bookingsRouter = require('./src/routes/bookings');
const weatherRouter = require('./src/routes/weather');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const mongoUrl = process.env.MONGODB_URL || process.env.mongodb_url;

if (!mongoUrl) {
  console.warn(
    'Warning: MONGODB_URL (or mongodb_url) is not set in the environment. ' +
    'Mongo connection will fail until this is configured.'
  );
}

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

app.use('/api/bookings', bookingsRouter);
app.use('/api/weather', weatherRouter);

// Forward audio transcription requests to the ML service
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype
    });

    const mlServiceUrl = `http://localhost:${process.env.ML_PORT || 5001}/transcribe`;

    const response = await axios.post(mlServiceUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Transcription proxy error:', error.message);
    res.status(500).json({
      error: 'Transcription failed',
      details: error.message
    });
  }
});

// Let the ML service validate special requests (allergies, dietary restrictions, etc.)
app.post('/api/ml/validate_request', async (req, res) => {
  try {
    const mlServiceUrl = `http://localhost:${process.env.ML_PORT || 5001}/validate_request`;

    const response = await axios.post(mlServiceUrl, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Validation proxy error:', error.message);
    // If validation fails, let the user through anyway - better UX than blocking them
    res.json({ valid: true, reason: 'Validation service unavailable' });
  }
});

// Serve the frontend from /public directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


