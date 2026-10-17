const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

export const validateTaskInput = (req, res, next) => {
  const { title, priority } = req.body;

  // On creation (POST), title is required and cannot be empty
  if (req.method === 'POST') {
    if (title === undefined || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required and cannot be empty.' });
    }
  }

  // On update (PUT/PATCH), if title is provided, it cannot be empty
  if (req.method === 'PUT' || req.method === 'PATCH') {
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }
  }

  // Validate priority if provided in request body
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      error: `Invalid priority: '${priority}'. Allowed values are: ${VALID_PRIORITIES.join(', ')}.`
    });
  }

  next();
};

export default validateTaskInput;
