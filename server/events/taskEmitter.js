import { EventEmitter } from 'node:events';

// Create a single shared EventEmitter instance for task lifecycle events
const taskEmitter = new EventEmitter();

// Register a safe error listener to prevent unhandled 'error' event exceptions
taskEmitter.on('error', (err) => {
  console.error('[EventEmitter Error]', err?.message || err);
});

export default taskEmitter;
