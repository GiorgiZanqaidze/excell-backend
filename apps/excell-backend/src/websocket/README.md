# WebSocket Module

This module provides real-time WebSocket communication for file upload progress tracking.

## Features

- Real-time progress updates during file processing
- Room-based communication for isolated job tracking
- Error handling and completion notifications
- Reusable service for other modules
- Type-safe enums for all events and statuses
- Consistent naming conventions

## Usage

### Frontend Connection

```javascript
import io from 'socket.io-client';

// Connect to WebSocket
const socket = io('http://localhost:3000/file-upload');

// Join upload room when starting upload
socket.emit('join-upload-room', { jobId: 'your-job-id' });

// Listen for progress updates
socket.on('upload-progress', (progress) => {
  console.log('Upload Progress:', progress);
  // Update your UI with progress.progress (0-100)
  // Show progress.message
  // Update progress bars, etc.
});

// Listen for completion
socket.on('upload-completed', (data) => {
  console.log('Upload Completed:', data);
  // Handle completion
});

// Listen for errors
socket.on('upload-error', (error) => {
  console.error('Upload Error:', error);
  // Handle error
});

// Leave room when done
socket.emit('leave-upload-room', { jobId: 'your-job-id' });
```

### TypeScript Usage

```typescript
import { WebSocketEvents, UploadStatus } from './websocket.enums';

// Use enums for type safety
socket.emit(WebSocketEvents.JOIN_UPLOAD_ROOM, { jobId: 'your-job-id' });
socket.on(WebSocketEvents.UPLOAD_PROGRESS, (progress) => {
  if (progress.status === UploadStatus.COMPLETED) {
    // Handle completion
  }
});
```

### Backend Usage

```typescript
import { WebSocketService } from './websocket.service';
import { UploadStatus } from './websocket.enums';

// Inject WebSocketService in any service
constructor(private readonly webSocketService: WebSocketService) {}

// Emit progress updates
this.webSocketService.emitProgress(jobId, {
  jobId,
  templateName: 'users',
  status: UploadStatus.PROCESSING,
  progress: 50,
  message: 'Processing 500 of 1000 rows',
  processed: 500,
  total: 1000,
});

// Emit completion
this.webSocketService.emitCompletion(jobId, result);

// Emit error
this.webSocketService.emitError(jobId, 'Error message');
```

## Events

### Client to Server

- `WebSocketEvents.JOIN_UPLOAD_ROOM` - Join a specific upload room
- `WebSocketEvents.LEAVE_UPLOAD_ROOM` - Leave a specific upload room
- `WebSocketEvents.PING` - Ping the server

### Server to Client

- `WebSocketEvents.UPLOAD_PROGRESS` - Progress updates during file processing
- `WebSocketEvents.UPLOAD_COMPLETED` - Upload completion notification
- `WebSocketEvents.UPLOAD_ERROR` - Error notification
- `WebSocketEvents.PONG` - Response to ping

## Progress Object Structure

```typescript
interface UploadProgress {
  jobId: string;
  templateName: string;
  status: UploadStatus;
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
  errors?: string[];
}
```

## Enums

### WebSocketEvents

```typescript
enum WebSocketEvents {
  // Client to Server
  JOIN_UPLOAD_ROOM = 'join-upload-room',
  LEAVE_UPLOAD_ROOM = 'leave-upload-room',
  PING = 'ping',

  // Server to Client
  UPLOAD_PROGRESS = 'upload-progress',
  UPLOAD_COMPLETED = 'upload-completed',
  UPLOAD_ERROR = 'upload-error',
  PONG = 'pong',
}
```

### UploadStatus

```typescript
enum UploadStatus {
  STARTED = 'started',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

### WebSocketRooms

```typescript
enum WebSocketRooms {
  UPLOAD = 'upload',
}
```

## Configuration

The WebSocket gateway is configured with:

- CORS enabled for all origins
- Namespace: `/file-upload`
- Automatic room management for job isolation
