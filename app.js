require('dotenv').config();


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const http = require('http');
const socketIo = require('socket.io');



// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const profileRoutes = require('./routes/profile');
const orderRoutes = require('./routes/order');
const checkoutRoutes = require('./routes/checkout');
const adminOrderRoutes = require('./routes/adminOrders');
const customOrderRoutes = require('./routes/customOrder');
const adminCustomOrderRoutes = require('./routes/admincustomorder');
const { authenticateToken, optionalAuthenticateToken, authorizeAdmin } = require('./middleware/auth');

// Import OTP services
const { generateOtp, sendOtpEmail } = require('./services/emailService');
const User = require('./models/user');
const Product = require('./models/product'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.set('io', io);

const PORT = process.env.PORT || 3000;

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
});

const db = mongoose.connection;
db.on('error', err => {
  console.error('MongoDB connection error:', err);
});
db.once('open', () => {
  console.log('MongoDB connection is open');
});

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.use('/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/admin', optionalAuthenticateToken, authorizeAdmin, adminRoutes);
app.use('/cart', cartRoutes);
app.use('/profile', profileRoutes);
app.use('/order', (req, res, next) => {
  req.io = io;
  next();
}, orderRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/custom-order', customOrderRoutes);
app.use('/', adminCustomOrderRoutes);
app.use('/', adminOrderRoutes);

app.get('/', optionalAuthenticateToken, async (req, res) => {
  const products = await Product.find(); // Fetch products from your database
  res.render('home', { token: req.cookies.token, user: req.user, products });
});

app.get('/shop', optionalAuthenticateToken, (req, res) => {
  res.render('shop', { user: req.user });
});

app.get('/account', (req, res) => {
  res.render('login-signup', { user: req.user });
});

app.get('/cart', authenticateToken, async (req, res) => {
  try {
      const user = await User.findById(req.user.id).populate('cart.product');
      res.render('cart', { user, cart: user.cart });
  } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).send({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
