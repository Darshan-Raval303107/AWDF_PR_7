import taskEmitter from './taskEmitter.js';

/**
 * Register background event listeners for task-related events.
 */
export const registerTaskListeners = () => {
  // Listener for 'task-created' event
  taskEmitter.on('task-created', ({ task, user }) => {
    try {
      const receivedTimestamp = new Date().toISOString();
      const taskId = task?.id || task?._id?.toString() || 'unknown';
      const taskTitle = task?.title || 'Untitled';
      const userIdentifier = user?.username || user?.email || (user?.id ? `User(${user.id})` : 'Anonymous');

      console.log(
        `[${receivedTimestamp}] [EVENT: task-created] Event received for Task ID: ${taskId} | Title: "${taskTitle}" | User: ${userIdentifier} -> Scheduling background notification (2s delay)`
      );

      // Asynchronous background notification processing simulation with a 2-second delay
      setTimeout(() => {
        try {
          const completedTimestamp = new Date().toISOString();
          console.log(
            `[${completedTimestamp}] [BACKGROUND COMPLETED] Simulated notification successfully sent for Task ID: ${taskId} | Title: "${taskTitle}" | Sent to: ${userIdentifier}`
          );
        } catch (bgError) {
          console.error('[BACKGROUND WORKER ERROR] Failed during background notification processing:', bgError.message);
          taskEmitter.emit('error', bgError);
        }
      }, 2000);
    } catch (listenerError) {
      console.error('[EVENT LISTENER ERROR] Error processing task-created event:', listenerError.message);
      taskEmitter.emit('error', listenerError);
    }
  });

  // Listener for 'task-deleted' event
  taskEmitter.on('task-deleted', ({ task, user }) => {
    try {
      const deletedTimestamp = new Date().toISOString();
      const taskId = task?.id || task?._id?.toString() || 'unknown';
      const taskTitle = task?.title || 'Untitled';
      const userIdentifier = user?.username || user?.email || (user?.id ? `User(${user.id})` : 'Anonymous');

      console.log(
        `[${deletedTimestamp}] [EVENT: task-deleted] Task deleted | Task ID: ${taskId} | Title: "${taskTitle}" | User: ${userIdentifier}`
      );
    } catch (err) {
      console.error('[EVENT LISTENER ERROR] Error processing task-deleted event:', err.message);
      taskEmitter.emit('error', err);
    }
  });

  console.log('Event listeners registered: [task-created, task-deleted]');
};

// Automatically register listeners on module import
registerTaskListeners();

export default taskEmitter;
