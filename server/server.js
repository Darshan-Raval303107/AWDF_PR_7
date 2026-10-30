import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import NodeCache from 'node-cache';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import validateTaskInput from './middleware/validateTaskInput.js';
import taskEmitter from './events/taskEmitter.js';
import './events/taskListeners.js';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/AWDF_PR_7';

// Initialize in-memory cache with standard TTL of 60 seconds
const taskCache = new NodeCache({ stdTTL: 60 });
const CACHE_KEY_TASKS = 'tasks_list';

// Enable CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Task Schema & Model configured with virtual id for client compatibility
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    completed: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

const Task = mongoose.model('Task', taskSchema);

// Connect to MongoDB database: AWDF_PR_7 (only when not in test environment)
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB database: AWDF_PR_7');
      
      // Seed default tasks if empty
      const count = await Task.countDocuments();
      if (count === 0) {
        await Task.insertMany([
          { title: 'Learn React Functional Components', description: 'Understand hooks, state, and props', priority: 'High' },
          { title: 'Build Express REST API', description: 'Create CRUD endpoints with Express and CORS', priority: 'Medium' },
          { title: 'Connect Frontend to Backend with Fetch', description: 'Use async fetch to sync React state with MongoDB', priority: 'Low' }
        ]);
        console.log('Seeded initial tasks into AWDF_PR_7 database');
      }
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
    });
}

// Authentication Routes (/register, /login, /me, /api/register, /api/login, /api/me)
app.use('/api', authRoutes);
app.use('/', authRoutes);

// AI Assistant Routes (/api/ai/generate-description, /ai/generate-description)
app.use('/api/ai', aiRoutes);
app.use('/ai', aiRoutes);

// Helper to support both /tasks and /api/tasks routes with in-memory caching
const handleGetTasks = async (req, res) => {
  try {
    const cachedTasks = taskCache.get(CACHE_KEY_TASKS);
    if (cachedTasks !== undefined) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedTasks);
    }

    const tasks = await Task.find().sort({ createdAt: 1 });
    taskCache.set(CACHE_KEY_TASKS, tasks);
    res.set('X-Cache', 'MISS');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
};
app.get('/tasks', authMiddleware, handleGetTasks);
app.get('/api/tasks', authMiddleware, handleGetTasks);

const handlePostTask = async (req, res) => {
  const { title, description, priority } = req.body;

  try {
    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority && ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Low'
    });

    // Invalidate task-list cache after successful write
    taskCache.del(CACHE_KEY_TASKS);

    // Record and log API-response timestamp
    const responseTimestamp = new Date().toISOString();
    console.log(
      `[${responseTimestamp}] [HTTP 201] Response sent for Task ID: ${newTask.id || newTask._id} | Title: "${newTask.title}"`
    );

    // Send HTTP 201 response immediately without waiting for background work
    res.status(201).json(newTask);

    // Emit task-created event with created task and authenticated user context
    taskEmitter.emit('task-created', {
      task: newTask,
      user: {
        id: req.user?._id ? req.user._id.toString() : req.user?.id,
        username: req.user?.username,
        email: req.user?.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};
app.post('/tasks', authMiddleware, validateTaskInput, handlePostTask);
app.post('/api/tasks', authMiddleware, validateTaskInput, handlePostTask);

const handlePutTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, completed } = req.body;

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (priority !== undefined && ['Low', 'Medium', 'High'].includes(priority)) updateData.priority = priority;
    if (completed !== undefined) updateData.completed = completed;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Invalidate task-list cache after successful update
    taskCache.del(CACHE_KEY_TASKS);

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
};
app.put('/tasks/:id', authMiddleware, validateTaskInput, handlePutTask);
app.put('/api/tasks/:id', authMiddleware, validateTaskInput, handlePutTask);

const handleDeleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Invalidate task-list cache after successful deletion
    taskCache.del(CACHE_KEY_TASKS);

    res.json({ message: 'Task deleted successfully' });

    // Emit task-deleted event only after successful deletion with actual pre-deletion task info
    taskEmitter.emit('task-deleted', {
      task: {
        id: deletedTask.id || deletedTask._id?.toString() || id,
        title: deletedTask.title || 'Untitled'
      },
      user: {
        id: req.user?._id ? req.user._id.toString() : req.user?.id,
        username: req.user?.username,
        email: req.user?.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
app.delete('/tasks/:id', authMiddleware, handleDeleteTask);
app.delete('/api/tasks/:id', authMiddleware, handleDeleteTask);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Server running',
    database: 'AWDF_PR_7',
    dbConnected: mongoose.connection.readyState === 1
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
export { app };
