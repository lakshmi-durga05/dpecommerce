// Libraries
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Product = require('./Product');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  confirmPassword: {
    type: String
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ],
  cart: [
    {
      id: Number,
      cartItem: {},
      qty: Number
    }
  ],
  orders: [
    {}
  ],
  role: {
    type: String,
    enum: ['customer','vendor','admin'],
    default: 'customer'
  },
  searchHistory: [
    {
      term: String,
      at: { type: Date, default: Date.now }
    }
  ]
  
});

// Token generation
const secretKey = process.env.SECRET_KEY;
userSchema.methods.generateAuthToken = async function() {
  try {
    const token = jwt.sign({ _id: this._id }, secretKey);
    this.tokens = this.tokens.concat({token: token});
    await this.save();
    return token;
  } catch (error) {
    console.log(error);
  }
}

// Add to cart
userSchema.methods.addToCart = async function(id, productInfo) {
  try {
    this.cart = this.cart.concat({ id: id, cartItem: productInfo, qty: 1 });
    await this.save();
  } catch (error) {
    console.log(error);
  }
}

// Orders
userSchema.methods.addOrder = async function(orderInfo) {
  try {
    this.orders = this.orders.concat({ orderInfo });
    this.cart = [];
    await this.save();
  } catch (error) {
    console.log(error);
  }
}

// Update quantity in cart
userSchema.methods.updateCartQty = async function(id, qty) {
  try {
    const item = (this.cart || []).find(ci => ci.id === Number(id));
    if (item) {
      item.qty = Math.max(1, Number(qty) || 1);
      await this.save();
    }
  } catch (error) {
    console.log(error);
  }
}

// Model
const User = mongoose.model("users", userSchema);

// Export model
module.exports = User;
