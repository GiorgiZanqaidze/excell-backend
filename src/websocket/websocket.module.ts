import { Module } from '@nestjs/common';
import { WebSocketService } from './websocket.service';
import { FileUploadWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [WebSocketService, FileUploadWebSocketGateway],
  exports: [WebSocketService],
})
export class WebSocketModule {}
