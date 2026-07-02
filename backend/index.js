const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const productsRouter = require('./routes/products');
const routinesRouter = require('./routes/routines');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
app.use('/api/products', productsRouter);
app.use('/api/routines', routinesRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Dear Skin API is running 🌸' });
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
