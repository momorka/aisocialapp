const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/socialapp';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    mood: { type: String, required: true },
    imageUrl: { type: String },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const pokeSchema = new mongoose.Schema({
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Poke = mongoose.model('Poke', pokeSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Email validation function
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// AI content generation (mock function)
const generatePostContent = async (topic, mood) => {
    const moodAdjectives = {
        happy: ['joyful', 'exciting', 'wonderful', 'amazing'],
        sad: ['melancholic', 'thoughtful', 'reflective', 'poignant'],
        excited: ['thrilling', 'energetic', 'dynamic', 'vibrant'],
        calm: ['peaceful', 'serene', 'tranquil', 'soothing'],
        angry: ['intense', 'passionate', 'powerful', 'bold']
    };

    const adjective = moodAdjectives[mood] || ['interesting'];
    const randomAdj = adjective[Math.floor(Math.random() * adjective.length)];

    return `This is a ${randomAdj} post about ${topic}. The mood here is ${mood}, and there's so much to explore about this topic. ${topic} has always been fascinating, and when viewed through a ${mood} lens, it becomes even more compelling. What are your thoughts on ${topic}?`;
};

// Routes

// Register
app.post('/api/auth/register', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6, max: 20 }).withMessage('Password must be between 6-20 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            email,
            username: username || undefined,
            password: hashedPassword
        });

        await user.save();

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET);
        res.status(201).json({
            token,
            user: { id: user._id, email: user.email, username: user.username }
        });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern.username) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please provide a valid email' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET);
        res.json({
            token,
            user: { id: user._id, email: user.email, username: user.username }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all posts (public)
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });

        const formattedPosts = posts.map(post => ({
            id: post._id,
            user_id: post.userId._id,
            topic: post.topic,
            mood: post.mood,
            image_url: post.imageUrl,
            content: post.content,
            created_at: post.createdAt,
            username: post.userId.username,
            email: post.userId.email
        }));

        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users (public)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email username createdAt');
        const formattedUsers = users.map(user => ({
            id: user._id,
            email: user.email,
            username: user.username,
            created_at: user.createdAt
        }));
        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single post with comments (public)
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('userId', 'username email');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comments = await Comment.find({ postId: req.params.id })
            .populate('userId', 'username email')
            .sort({ createdAt: -1 });

        const formattedComments = comments.map(comment => ({
            id: comment._id,
            user_id: comment.userId._id,
            content: comment.content,
            created_at: comment.createdAt,
            username: comment.userId.username,
            email: comment.userId.email
        }));

        const formattedPost = {
            id: post._id,
            user_id: post.userId._id,
            topic: post.topic,
            mood: post.mood,
            image_url: post.imageUrl,
            content: post.content,
            created_at: post.createdAt,
            username: post.userId.username,
            email: post.userId.email,
            comments: formattedComments
        };

        res.json(formattedPost);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to post (private)
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        const comment = new Comment({
            postId: req.params.id,
            userId: req.user.userId,
            content: content.trim()
        });

        await comment.save();
        res.status(201).json({ id: comment._id, message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment' });
    }
});

// Get single user (public)
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, 'email username createdAt');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const formattedUser = {
            id: user._id,
            email: user.email,
            username: user.username,
            created_at: user.createdAt
        };

        res.json(formattedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Poke user (private)
app.post('/api/users/:id/poke', authenticateToken, async (req, res) => {
    const toUserId = req.params.id;
    const fromUserId = req.user.userId;

    if (toUserId === fromUserId) {
        return res.status(400).json({ message: 'Cannot poke yourself' });
    }

    try {
        const poke = new Poke({
            fromUserId,
            toUserId
        });

        await poke.save();

        // Emit socket event for real-time notification
        io.emit('poke', { fromUserId, toUserId });

        res.status(201).json({ message: 'Poke sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to poke user' });
    }
});

// Get user profile (private)
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId, 'email username createdAt');
        const formattedUser = {
            id: user._id,
            email: user.email,
            username: user.username,
            created_at: user.createdAt
        };
        res.json(formattedUser);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update username (private)
app.put('/api/profile/username', authenticateToken, async (req, res) => {
    const { username } = req.body;

    if (!username || username.trim() === '') {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Check if username is already taken
        const existingUser = await User.findOne({
            username: username.trim(),
            _id: { $ne: req.user.userId }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        await User.findByIdAndUpdate(req.user.userId, { username: username.trim() });
        res.json({ message: 'Username updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update username' });
    }
});

// Get pokes history (private)
app.get('/api/profile/pokes', authenticateToken, async (req, res) => {
    try {
        const pokes = await Poke.find({ toUserId: req.user.userId })
            .populate('fromUserId', 'username email')
            .sort({ createdAt: -1 });

        const formattedPokes = pokes.map(poke => ({
            id: poke._id,
            username: poke.fromUserId.username,
            email: poke.fromUserId.email,
            created_at: poke.createdAt
        }));

        res.json(formattedPokes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create post (private)
app.post('/api/posts', authenticateToken, async (req, res) => {
    const { topic, mood, image_url } = req.body;

    if (!topic || !mood) {
        return res.status(400).json({ message: 'Topic and mood are required' });
    }

    try {
        const content = await generatePostContent(topic, mood);

        const post = new Post({
            userId: req.user.userId,
            topic,
            mood,
            imageUrl: image_url || undefined,
            content
        });

        await post.save();
        res.status(201).json({ id: post._id, message: 'Post created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create post' });
    }
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_chat', (username) => {
        socket.username = username;
        socket.broadcast.emit('user_joined', username);
    });

    socket.on('send_message', (data) => {
        io.emit('receive_message', {
            username: socket.username,
            message: data.message,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            socket.broadcast.emit('user_left', socket.username);
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});