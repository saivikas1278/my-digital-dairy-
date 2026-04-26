require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

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
    res.status(500).send('Registration failed');
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
    res.status(500).json({ message: 'Login error' });
  }
});

app.post('/newpost', async (req, res) => {
  const { title, content, userId, date, category, mood } = req.body; // <-- add category and mood
  try {
    const newPost = new Post({ title, content, userId, date, category, mood }); // <-- save category and mood with post
    await newPost.save();
    res.status(200).json({ message: 'Post created', title, content, userId, category, mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving post' });
  }
});

app.get('/posts', async (req, res) => {
  const { userId } = req.query; // Get userId from query params
  try {
    const posts = await Post.find({ userId }).sort({ _id: -1 }); // Filter by userId
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

app.get('/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching post' });
  }
});


// Delete post
app.delete('/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

// Edit post
app.put('/posts/:id', async (req, res) => {
  const { title, content, date, category, mood } = req.body;
  try {
    await Post.findByIdAndUpdate(req.params.id, { title, content, date, category, mood });
    res.status(200).json({ message: 'Post updated' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

const PORT = process.env.PORT || 20000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
