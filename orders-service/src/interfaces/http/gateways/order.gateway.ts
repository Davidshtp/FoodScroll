import { 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_SECRET_KEY } from '../../../infrastructure/config/constants';
import { Order } from '../../../domain/entities/order.entity';

interface JwtPayload {
  sub: string;
  role: string;
  client: string;
  appStatus?: string | null;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
})
export class OrderGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('OrderGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('WebSocket initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(JWT_SECRET_KEY),
      });

      // Attach user info to socket for later use
      client.data.user = {
        id: payload.sub,
        role: payload.role,
        client: payload.client,
      };

      this.logger.log(`Client authenticated: ${client.data.user.id}`);
    } catch (error) {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinOrderRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { orderId: string }): void {
    // Ensure the user is authenticated (should be, due to handleConnection)
    if (!client.data.user) {
      client.disconnect();
      return;
    }

    client.join(payload.orderId);
    this.logger.log(`Client ${client.id} (user: ${client.data.user.id}) joined order room: ${payload.orderId}`);
  }

  @SubscribeMessage('leaveOrderRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { orderId: string }): void {
    client.leave(payload.orderId);
    this.logger.log(`Client ${client.id} left order room: ${payload.orderId}`);
  }

  emitOrderStatusUpdate(orderId: string, order: Order): void {
    const payload = {
      event: 'order.status.updated',
      data: {
        orderId: order.id,
        status: order.status,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
        deliveryId: order.deliveryId,
        totalAmount: order.totalAmount,
        orderItems: order.orderItems,
        timestamp: new Date().toISOString(),
      },
    };
    this.server.to(orderId).emit('order.status.updated', payload);
    this.logger.log(`Emitted order.status.updated for order ${orderId}: ${order.status}`);
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Check if token is in the Authorization header
    const authHeader = client.handshake.headers.authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Alternatively, check query parameters
    return client.handshake.auth?.token ?? null;
  }
}