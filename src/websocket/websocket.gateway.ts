import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { LoggerService } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { WebSocketEvents, WebSocketRooms } from './websocket.enums';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/file-upload',
})
@Injectable()
export class FileUploadWebSocketGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FileUploadWebSocketGateway.name);

  constructor(
    private readonly webSocketService: WebSocketService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly winstonLogger: LoggerService,
  ) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
    // Set the gateway instance in the service
    this.webSocketService.setGateway(this);
  }

  @SubscribeMessage(WebSocketEvents.JOIN_UPLOAD_ROOM)
  handleJoinRoom(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { jobId } = data;
    const room = `${WebSocketRooms.UPLOAD}-${jobId}`;
    client.join(room);
    this.logger.log(`Client joined upload room: ${room}`);

    void this.winstonLogger.log({
      message: 'websocket.client.join',
      jobId,
      clientId: client.id,
      room,
    });
  }

  @SubscribeMessage(WebSocketEvents.LEAVE_UPLOAD_ROOM)
  handleLeaveRoom(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const { jobId } = data;
    const room = `${WebSocketRooms.UPLOAD}-${jobId}`;
    client.leave(room);
    this.logger.log(`Client left upload room: ${room}`);

    void this.winstonLogger.log({
      message: 'websocket.client.leave',
      jobId,
      clientId: client.id,
      room,
    });
  }

  @SubscribeMessage(WebSocketEvents.PING)
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit(WebSocketEvents.PONG, { timestamp: new Date().toISOString() });
  }

  // Handle client disconnection
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.winstonLogger.log({
      message: 'websocket.client.disconnect',
      clientId: client.id,
    });
  }

  // Handle client connection
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.winstonLogger.log({
      message: 'websocket.client.connect',
      clientId: client.id,
    });
  }
}
