/**
 * WebSocket message event names
 */
export enum WebSocketEvents {
  // Client to Server events
  JOIN_UPLOAD_ROOM = 'join-upload-room',
  LEAVE_UPLOAD_ROOM = 'leave-upload-room',
  PING = 'ping',

  // Server to Client events
  UPLOAD_PROGRESS = 'upload-progress',
  UPLOAD_COMPLETED = 'upload-completed',
  UPLOAD_ERROR = 'upload-error',
  PONG = 'pong',
}

/**
 * Upload processing statuses
 */
export enum UploadStatus {
  STARTED = 'started',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * WebSocket room prefixes
 */
export enum WebSocketRooms {
  UPLOAD = 'upload',
}

/**
 * WebSocket message types for better type safety
 */
export enum MessageType {
  PROGRESS = 'progress',
  COMPLETION = 'completion',
  ERROR = 'error',
  CUSTOM = 'custom',
}
