const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is healthy' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
