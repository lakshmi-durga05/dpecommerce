// Libraries
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 8000;
var path = require('path');

const app = express();

// Database connection
require('./database/connection');

// Product Model
const Product = require('./models/Product');
const defaultData = require('./defaultData');

// Routes
const router = require('./routes/router');
const erpRouter = require('./routes/erp');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser(""));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];
app.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed from origin ' + origin), false);
  }
}));
app.use('/api', router);
app.use('/api/erp', erpRouter);

// Seed products on startup if empty (local convenience)
(async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await defaultData();
      console.log('Seeded default products');
    }
  } catch (e) {
    console.log('Seeding check failed', e);
  }
})();

// For deployment
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname,  "client/build", "index.html"));
  });
}

// Server
app.listen(port, function() {
  console.log("Server started at port " + port);
})

// ===== To store data from productsData.js =====
// const defaultData = require('./defaultData');
// defaultData();