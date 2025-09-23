import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import { Server } from 'socket.io';
import {
  WebSocketEvents,
  UploadStatus,
  WebSocketRooms,
  MessageType,
} from './websocket.enums';

export interface UploadProgress {
  jobId: string;
  templateName: string;
  status: UploadStatus;
  progress: number; // 0-100
  message: string;
  processed?: number;
  total?: number;
  errors?: string[];
}

export interface UploadResult {
  jobId: string;
  result: unknown;
  timestamp: string;
}

export interface UploadError {
  jobId: string;
  error: string;
  timestamp: string;
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private gateway: { server: Server } | null = null; // Will be set by the gateway

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly winstonLogger: LoggerService,
  ) {}

  // Set the gateway instance (called by the gateway)
  setGateway(gateway: { server: Server }): void {
    this.gateway = gateway;
  }

  // Public method to emit progress updates
  emitProgress(jobId: string, progress: UploadProgress): void {
    if (!this.gateway) {
      this.logger.warn('WebSocket gateway not initialized');
      return;
    }

    this.gateway.server
      .to(`${WebSocketRooms.UPLOAD}-${jobId}`)
      .emit(WebSocketEvents.UPLOAD_PROGRESS, progress);
    this.winstonLogger.log({
      message: 'websocket.progress.emit',
      jobId,
      progress,
      type: MessageType.PROGRESS,
    });
  }

  // Public method to emit completion
  emitCompletion(jobId: string, result: unknown): void {
    if (!this.gateway) {
      this.logger.warn('WebSocket gateway not initialized');
      return;
    }

    const uploadResult: UploadResult = {
      jobId,
      result,
      timestamp: new Date().toISOString(),
    };

    this.gateway.server
      .to(`${WebSocketRooms.UPLOAD}-${jobId}`)
      .emit(WebSocketEvents.UPLOAD_COMPLETED, uploadResult);
    this.winstonLogger.log({
      message: 'websocket.completion.emit',
      jobId,
      result,
      type: MessageType.COMPLETION,
    });
  }

  // Public method to emit error
  emitError(jobId: string, error: string): void {
    if (!this.gateway) {
      this.logger.warn('WebSocket gateway not initialized');
      return;
    }

    const uploadError: UploadError = {
      jobId,
      error,
      timestamp: new Date().toISOString(),
    };

    this.gateway.server
      .to(`${WebSocketRooms.UPLOAD}-${jobId}`)
      .emit(WebSocketEvents.UPLOAD_ERROR, uploadError);
    this.winstonLogger.error({
      message: 'websocket.error.emit',
      jobId,
      error,
      type: MessageType.ERROR,
    });
  }

  // Public method to emit custom events
  emitToRoom(room: string, event: string, data: unknown): void {
    if (!this.gateway) {
      this.logger.warn('WebSocket gateway not initialized');
      return;
    }

    this.gateway.server.to(room).emit(event, data);
    this.winstonLogger.log({
      message: 'websocket.custom.emit',
      room,
      event,
      data,
      type: MessageType.CUSTOM,
    });
  }

  // Public method to get connected clients count
  getConnectedClientsCount(): number {
    if (!this.gateway) {
      return 0;
    }
    return this.gateway.server.engine.clientsCount;
  }

  // Public method to get clients in a specific room
  getClientsInRoom(room: string): number {
    if (!this.gateway) {
      return 0;
    }
    const roomClients = this.gateway.server.sockets.adapter.rooms.get(room);
    return roomClients ? roomClients.size : 0;
  }
}
