const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
const dbURI = process.env.MONGODB_URI;

function connectDB(uri) {
  if (!uri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI is not defined in the environment variables.');
    return;
  }
  
  // Set short timeout (5s) for connection selection so requests don't hang indefinitely if Atlas is unreachable
  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  })
    .then(() => {
      console.log(`✅ MongoDB connected successfully to Atlas Database`);
    })
    .catch((err) => {
      console.error(`❌ MongoDB connection failed: ${err.message}`);
    });
}

connectDB(dbURI);

// Middleware to check DB connection for API routes to prevent query hanging or crashing
app.use((req, res, next) => {
  const apiPaths = ['/registerform', '/userlogin', '/newpost', '/posts'];
  const isApiRoute = apiPaths.some(path => req.path.startsWith(path));
  
  if (isApiRoute && mongoose.connection.readyState !== 1) {
    console.error(`❌ Database not connected for API request: ${req.method} ${req.path}`);
    return res.status(503).json({ 
      message: 'Database is not connected. Please verify your MONGODB_URI environment variable and check database accessibility.' 
    });
  }
  next();
});

// Schemas
const userSchema = new mongoose.Schema({ name: String, email: String, password: String });
const User = mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: String, // or Date if you want to store as a Date type
  category: {
    type: String,
    default: 'personal',
    enum: ['personal', 'work', 'travel', 'health', 'goals', 'gratitude', 'other']
  },
  mood: {
    type: String,
    default: '😊',
    enum: ['😊', '😢', '😴', '😡', '😍', '🤔', '😰', '🥳', '😌', '🤒']
  }
});
const Post = mongoose.model('Post', postSchema);

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'super!' });
});


app.post('/registerform', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing fields');
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).send('User already exists');
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password!
    const newUser = new User({ name, email: normalizedEmail, password: hashedPassword });
    await newUser.save();
    res.status(200).send('Registration successful');
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).send('Registration failed: ' + err.message);
  }
});

app.post('/userlogin', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password); // Compare hash!
    if (isMatch) {
      res.status(200).json({ message: 'Login successful', userId: user._id, email: user.email, name: user.name });
    } else {
      res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Login error: ' + err.message });
  }
});

app.post('/newpost', async (req, res) => {
  const { title, content, userId, date, category, mood } = req.body;
  
  // Validate userId to prevent database query crashes
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Missing or invalid userId' });
  }

  try {
    const newPost = new Post({ title, content, userId, date, category, mood });
    await newPost.save();
    res.status(200).json({ message: 'Post created', title, content, userId, category, mood });
  } catch (err) {
    console.error('Error saving post:', err);
    res.status(500).json({ message: 'Error saving post: ' + err.message });
  }
});

app.get('/posts', async (req, res) => {
  const { userId } = req.query; // Get userId from query params

  // Validate userId to prevent database query CastErrors
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Missing or invalid userId' });
  }

  try {
    const posts = await Post.find({ userId }).sort({ _id: -1 }); // Filter by userId
    res.status(200).json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts: ' + err.message });
  }
});

app.get('/posts/:id', async (req, res) => {
  // Validate post ID to prevent CastErrors
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Error fetching post: ' + err.message });
  }
});


// Delete post
app.delete('/posts/:id', async (req, res) => {
  // Validate post ID to prevent CastErrors
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ message: 'Delete failed: ' + err.message });
  }
});

// Edit post
app.put('/posts/:id', async (req, res) => {
  // Validate post ID to prevent CastErrors
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const { title, content, date, category, mood } = req.body;
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, { title, content, date, category, mood }, { new: true });
    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json({ message: 'Post updated' });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ message: 'Update failed: ' + err.message });
  }
});


if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 20000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
