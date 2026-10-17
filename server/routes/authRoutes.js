import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to sanitize user object before sending in response
const sanitizeUser = (user) => ({
  id: user._id ? user._id.toString() : user.id,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

/**
 * @route   POST /register
 * @desc    Register a new user with hashed password
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters long.' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check for existing user with duplicate email or username
    const existingUser = await User.findOne({
      $or: [{ email: trimmedEmail }, { username: trimmedUsername }]
    });

    if (existingUser) {
      if (existingUser.email === trimmedEmail) {
        return res.status(409).json({ error: 'Email is already registered.' });
      }
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Hash password using bcryptjs with 10 salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Save user to MongoDB
    const newUser = await User.create({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword
    });

    // Return HTTP 201 on success without password or hash
    return res.status(201).json({
      message: 'User registered successfully.',
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register user.', details: err.message });
  }
});

/**
 * @route   POST /login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body;
    const loginIdentifier = email || username || identifier;

    // Validate input fields
    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const trimmedIdentifier = loginIdentifier.trim();

    // Find user by either email or username
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { username: trimmedIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check JWT_SECRET configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured on the server.' });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email
      },
      jwtSecret,
      { expiresIn }
    );

    // Return token and safe user profile
    return res.json({
      message: 'Login successful.',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed.', details: err.message });
  }
});

/**
 * @route   GET /me
 * @desc    Get currently logged-in user's profile
 * @access  Private (Protected by authMiddleware)
 */
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    user: sanitizeUser(req.user)
  });
});

export default router;
