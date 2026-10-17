import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Server, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  AlertCircle,
  Loader2,
  RotateCcw,
  Flag,
  ListTodo,
  CheckCheck,
  Clock,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TodoApp.css';

const API_URL = '/api/tasks';
const FALLBACK_URL = 'http://localhost:5001/api/tasks';

export default function TodoApp() {
  const { token, currentUser, logout } = useAuth();

  const apiFetch = async (endpoint = '', options = {}) => {
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const requestOptions = {
      ...options,
      headers
    };

    let res;
    try {
      res = await fetch(`${API_URL}${endpoint}`, requestOptions);
    } catch {
      res = await fetch(`${FALLBACK_URL}${endpoint}`, requestOptions);
    }

    if (res && res.status === 401) {
      logout('Your session has expired. Please log in again.');
    }

    return res;
  };

  const [tasks, setTasks] = useState([]);
  const [inputTitle, setInputTitle] = useState('');
  const [inputDescription, setInputDescription] = useState('');
  const [inputPriority, setInputPriority] = useState('Low');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingPriority, setEditingPriority] = useState('Low');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dbStatus, setDbStatus] = useState('Connecting to MongoDB...');
  
  // Toast Notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3200);
  };

  // 1. Fetch all tasks with loading and error states
  const fetchTasks = async (isManual = false) => {
    try {
      setLoading(true);
      const res = await apiFetch();
      if (res && res.ok) {
        const data = await res.json();
        setTasks(data);
        setDbStatus('Connected to MongoDB (AWDF_PR_7)');
        if (isManual) {
          showToast('Tasks refreshed from MongoDB!', 'success');
        }
      } else {
        setDbStatus('Backend API error');
        showToast('Error: Failed to fetch tasks from server', 'error');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setDbStatus('Server offline (Run npm start in server)');
      showToast('Could not reach backend server on port 5001', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  // 2. Add task with Description, Priority (default Low) & Optimistic UI Update
  const handleAddTask = async (e) => {
    e.preventDefault();
    const title = inputTitle.trim();
    if (!title) return;

    const description = inputDescription.trim();
    const priority = inputPriority || 'Low';

    // Optimistic UI Update: generate temp task and show immediately in UI
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      id: tempId,
      _id: tempId,
      title,
      description,
      priority,
      completed: false,
      isOptimistic: true,
      createdAt: new Date().toISOString()
    };

    setTasks((prev) => [...prev, optimisticTask]);
    setInputTitle('');
    setInputDescription('');
    setInputPriority('Low');
    setSubmitting(true);

    try {
      const res = await apiFetch('', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      });

      if (res && res.ok) {
        const serverTask = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === tempId || t._id === tempId ? serverTask : t))
        );
        showToast(`Task created with ${priority} priority in AWDF_PR_7!`, 'success');
      } else {
        throw new Error('Server rejected task creation');
      }
    } catch (err) {
      console.error('Failed to save task:', err);
      setTasks((prev) => prev.filter((t) => t.id !== tempId && t._id !== tempId));
      showToast('Failed to save task to MongoDB. State reverted.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Toggle task completion (Mark as Complete / Mark as Pending)
  const handleToggleComplete = async (task) => {
    const taskId = task.id || task._id;
    const newStatus = !task.completed;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => ((t.id || t._id) === taskId ? { ...t, completed: newStatus } : t))
    );

    try {
      const res = await apiFetch(`/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus })
      });

      if (res && res.ok) {
        showToast(
          newStatus ? 'Task marked as Completed!' : 'Task marked as Pending.',
          newStatus ? 'success' : 'info'
        );
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      setTasks((prev) =>
        prev.map((t) => ((t.id || t._id) === taskId ? { ...t, completed: !newStatus } : t))
      );
      showToast('Failed to update task status in MongoDB', 'error');
    }
  };

  // 4. Update task (title, description, priority)
  const startEdit = (task) => {
    const taskId = task.id || task._id;
    setEditingId(taskId);
    setEditingTitle(task.title);
    setEditingDescription(task.description || '');
    setEditingPriority(task.priority || 'Low');
  };

  const handleUpdateTask = async (id) => {
    if (!editingTitle.trim()) return;

    try {
      setUpdatingId(id);
      const res = await apiFetch(`/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTitle.trim(),
          description: editingDescription.trim(),
          priority: editingPriority || 'Low'
        })
      });

      if (res && res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => ((t.id || t._id) === id ? updated : t)));
        setEditingId(null);
        setEditingTitle('');
        setEditingDescription('');
        setEditingPriority('Low');
        showToast('Task updated successfully in AWDF_PR_7!', 'success');
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('Failed to update task', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // 5. Delete task with Confirmation Dialog
  const confirmDeleteTask = async () => {
    if (!deletingTask) return;
    const id = deletingTask.id || deletingTask._id;

    try {
      setIsDeleting(true);
      const res = await apiFetch(`/${id}`, {
        method: 'DELETE'
      });

      if (res && res.ok) {
        setTasks((prev) => prev.filter((t) => (t.id || t._id) !== id));
        showToast('Task deleted from AWDF_PR_7 database!', 'info');
        setDeletingTask(null);
      } else {
        throw new Error('Delete failed');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Failed to delete task from MongoDB', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.section 
      className="todo-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {/* Toast Notification Component */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            className={`toast-notification toast-${toast.type}`}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast.type === 'success' && <Check size={18} className="toast-icon" />}
            {toast.type === 'error' && <AlertCircle size={18} className="toast-icon" />}
            {toast.type === 'info' && <CheckCircle2 size={18} className="toast-icon" />}
            <span className="toast-message">{toast.message}</span>
            <button 
              onClick={() => setToast((prev) => ({ ...prev, show: false }))} 
              className="toast-close"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal Dialog */}
      <AnimatePresence>
        {deletingTask && (
          <div className="modal-backdrop">
            <motion.div 
              className="modal-content glass-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <div className="modal-warning-icon">
                  <AlertTriangle size={24} />
                </div>
                <h3>Delete Task Confirmation</h3>
              </div>
              <p className="modal-body">
                Are you sure you want to delete this task?
                <br />
                <strong className="delete-task-preview">"{deletingTask.title}"</strong>
                <br />
                This will permanently remove the document from the <strong>AWDF_PR_7</strong> MongoDB database.
              </p>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="modal-cancel-btn" 
                  onClick={() => setDeletingTask(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="modal-confirm-delete-btn" 
                  onClick={confirmDeleteTask}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="spinning" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="section-header text-center">
        <h2 className="section-title">
          To-Do <span className="gradient-text">Manager</span>
        </h2>
      </div>
      
      {/* Environment & Connection Badges */}
      <div className="todo-badges">
        <span className="badge server-badge">
          <Server size={14} /> Port: 5001
        </span>
        <span className="badge db-badge">
          <Database size={14} /> DB: AWDF_PR_7
        </span>
        <span className="badge status-badge">
          {dbStatus}
        </span>
        {currentUser && (
          <span className="badge user-badge" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <UserIcon size={14} /> {currentUser.username || currentUser.email}
          </span>
        )}
        <button onClick={() => fetchTasks(true)} className="refresh-btn" title="Refresh Tasks from MongoDB">
          <RefreshCw size={13} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Total / Completed / Pending Stats Bar (Horizontal) */}
      <div className="todo-stats-bar">
        <div className="stat-pill stat-total">
          <ListTodo size={20} className="stat-icon" />
          <div className="stat-details">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-text">Total Tasks</span>
          </div>
        </div>
        <div className="stat-pill stat-completed">
          <CheckCheck size={20} className="stat-icon" />
          <div className="stat-details">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-text">Completed</span>
          </div>
        </div>
        <div className="stat-pill stat-pending">
          <Clock size={20} className="stat-icon" />
          <div className="stat-details">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-text">Pending</span>
          </div>
        </div>
      </div>

      <div className="todo-wrapper">
        <div className="todo-app-card">
          {/* Add Task Form with Description & Priority (default Low) */}
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="form-main-row">
              <input
                type="text"
                placeholder="Enter a new task title (e.g. Build Express REST API)..."
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                className="todo-input"
                disabled={submitting}
              />
              <div className="priority-select-wrapper">
                <Flag size={15} className={`priority-flag-icon priority-flag-${inputPriority.toLowerCase()}`} />
                <select
                  value={inputPriority}
                  onChange={(e) => setInputPriority(e.target.value)}
                  className={`priority-select priority-select-${inputPriority.toLowerCase()}`}
                  disabled={submitting}
                  title="Task Priority (default is Low)"
                >
                  <option value="Low">Low Priority (Default)</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <button type="submit" className="add-btn" disabled={submitting || !inputTitle.trim()}>
                {submitting ? (
                  <>
                    <Loader2 size={18} className="spinning" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Add Task</span>
                  </>
                )}
              </button>
            </div>

            {/* Description Box */}
            <div className="form-desc-row">
              <textarea
                placeholder="Description (optional) - Add notes or requirements for this task..."
                value={inputDescription}
                onChange={(e) => setInputDescription(e.target.value)}
                className="todo-desc-input"
                rows={2}
                disabled={submitting}
              />
            </div>
          </form>

          {/* Task List */}
          {loading && tasks.length === 0 ? (
            <div className="todo-loading">
              <Loader2 size={24} className="spinning loading-icon" />
              <p>Fetching tasks from AWDF_PR_7 database...</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => {
                const taskId = task.id || task._id;
                const isCompleted = !!task.completed;
                const isOptimistic = !!task.isOptimistic;
                const priority = task.priority || 'Low';

                return (
                  <li 
                    key={taskId} 
                    className={`task-item ${isCompleted ? 'completed-item' : ''} ${isOptimistic ? 'optimistic-item' : ''}`}
                  >
                    {editingId === taskId ? (
                      /* Inline Edit Mode */
                      <div className="edit-container-full">
                        <div className="edit-row-top">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="edit-input"
                            autoFocus
                            placeholder="Task title..."
                            disabled={updatingId === taskId}
                          />
                          <select
                            value={editingPriority}
                            onChange={(e) => setEditingPriority(e.target.value)}
                            className="edit-priority-select"
                            disabled={updatingId === taskId}
                          >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                          </select>
                        </div>
                        <div className="edit-row-desc">
                          <textarea
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            className="edit-desc-input"
                            placeholder="Task description (optional)..."
                            rows={2}
                            disabled={updatingId === taskId}
                          />
                        </div>
                        <div className="edit-row-actions">
                          <button 
                            type="button"
                            className="save-btn" 
                            onClick={() => handleUpdateTask(taskId)}
                            title="Save Changes"
                            disabled={updatingId === taskId}
                          >
                            {updatingId === taskId ? (
                              <Loader2 size={15} className="spinning" />
                            ) : (
                              <Save size={15} />
                            )}
                            <span>{updatingId === taskId ? 'Saving...' : 'Save Changes'}</span>
                          </button>
                          <button 
                            type="button"
                            className="cancel-btn" 
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                            disabled={updatingId === taskId}
                          >
                            <X size={15} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Task Item Display */
                      <>
                        <div className="task-content-left">
                          <div 
                            className="task-header-row"
                            onClick={() => handleToggleComplete(task)}
                            title="Click to toggle status"
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={20} className="task-check-icon checked" />
                            ) : (
                              <Circle size={20} className="task-check-icon unchecked" />
                            )}
                            <span className={`task-text ${isCompleted ? 'line-through' : ''}`}>
                              {task.title}
                            </span>
                            
                            {/* Priority Badge */}
                            <span className={`priority-tag priority-tag-${priority.toLowerCase()}`}>
                              <Flag size={11} /> {priority}
                            </span>

                            {isOptimistic && (
                              <span className="optimistic-tag">Saving to DB...</span>
                            )}
                          </div>

                          {/* Task Description Box */}
                          {task.description && (
                            <p className={`task-desc-display ${isCompleted ? 'desc-completed' : ''}`}>
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons: Mark as Complete / Mark as Pending, Edit, Delete */}
                        <div className="button-group">
                          {/* Dedicated Mark as Complete / Mark as Pending Button */}
                          <button 
                            type="button"
                            className={`action-btn complete-btn ${isCompleted ? 'btn-mark-pending' : 'btn-mark-complete'}`}
                            onClick={() => handleToggleComplete(task)}
                            title={isCompleted ? "Mark task as Pending" : "Mark task as Complete"}
                          >
                            {isCompleted ? (
                              <>
                                <RotateCcw size={15} />
                                <span>Mark Pending</span>
                              </>
                            ) : (
                              <>
                                <Check size={15} />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>

                          {/* Edit Button */}
                          <button 
                            type="button"
                            className="action-btn edit-btn" 
                            onClick={() => startEdit(task)}
                            title="Edit task title, description, or priority"
                          >
                            <Edit2 size={15} />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button 
                            type="button"
                            className="action-btn delete-btn" 
                            onClick={() => setDeletingTask(task)}
                            title="Delete task with confirmation"
                          >
                            <Trash2 size={15} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && tasks.length === 0 && (
            <div className="empty-msg">
              <p>No tasks found in <strong>AWDF_PR_7</strong> database.</p>
              <p className="empty-sub">Type a task title, select priority, and click <strong>Add Task</strong>!</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
