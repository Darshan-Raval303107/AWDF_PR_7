import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/AWDF_PR';

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

// Connect to MongoDB database: AWDF_PR
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB database: AWDF_PR');
    const count = await Task.countDocuments();
    if (count === 0) {
      await Task.insertMany([
        { title: 'Learn React Functional Components', description: 'Understand hooks, state, and props', priority: 'High' },
        { title: 'Build Express REST API', description: 'Create CRUD endpoints with Express and CORS', priority: 'Medium' },
        { title: 'Connect Frontend to Backend with Fetch', description: 'Use async fetch to sync React state with MongoDB', priority: 'Low' }
      ]);
      console.log('Seeded initial tasks into AWDF_PR database');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Helper to support both /tasks and /api/tasks routes
const handleGetTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
};
app.get('/tasks', handleGetTasks);
app.get('/api/tasks', handleGetTasks);

const handlePostTask = async (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const newTask = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority && ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Low'
    });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
};
app.post('/tasks', handlePostTask);
app.post('/api/tasks', handlePostTask);

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

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
};
app.put('/tasks/:id', handlePutTask);
app.put('/api/tasks/:id', handlePutTask);

const handleDeleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
};
app.delete('/tasks/:id', handleDeleteTask);
app.delete('/api/tasks/:id', handleDeleteTask);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Server running',
    database: 'AWDF_PR',
    dbConnected: mongoose.connection.readyState === 1
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
