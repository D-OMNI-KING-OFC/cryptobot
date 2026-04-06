require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiProxy = require('./routes/aiProxy');
const proxy = require('./routes/proxy');
const sanbase = require('./routes/sanbase');
const advanced = require('./routes/advanced');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', aiProxy);
app.use('/api', proxy);
app.use('/api', sanbase);
app.use('/api', advanced);

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
