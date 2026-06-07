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
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_SECRET_KEY } from '../../../infrastructure/config/constants';
import { OrderRepository, ORDER_REPOSITORY } from '../../../domain/repositories/order.repository';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { OrderStatus } from '../../../domain/enums/order-status.enum';
import { Order } from '../../../domain/entities/order.entity';
import { haversineDistance } from '../../../common/utils/haversine';

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
  private readonly lastLocationEmit = new Map<string, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(ORDER_REPOSITORY) private readonly orderRepo: OrderRepository,
    private readonly redisService: RedisService,
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
    this.lastLocationEmit.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinOrderRoom')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { orderId: string }): Promise<void> {
    if (!client.data.user) {
      client.disconnect();
      return;
    }

    client.join(payload.orderId);
    this.logger.log(`Client ${client.id} (user: ${client.data.user.id}) joined order room: ${payload.orderId}`);

    const lastPos = await this.redisService.get(`delivery:lastpos:${payload.orderId}`);
    if (lastPos) {
      const parsed = JSON.parse(lastPos);
      client.emit('delivery.location.updated', {
        orderId: payload.orderId,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        timestamp: parsed.timestamp,
      });
    }
  }

  @SubscribeMessage('leaveOrderRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { orderId: string }): void {
    client.leave(payload.orderId);
    this.logger.log(`Client ${client.id} left order room: ${payload.orderId}`);
  }

  @SubscribeMessage('delivery.location.updated')
  async handleDeliveryLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId: string; latitude: number; longitude: number },
  ): Promise<void> {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    if (user.role !== 'DELIVERY') return;

    if (
      typeof payload.latitude !== 'number' ||
      typeof payload.longitude !== 'number' ||
      payload.latitude < -90 || payload.latitude > 90 ||
      payload.longitude < -180 || payload.longitude > 180
    ) return;

    const now = Date.now();
    const last = this.lastLocationEmit.get(client.id);
    if (last && now - last < 1000) return;
    this.lastLocationEmit.set(client.id, now);

    const order = await this.orderRepo.findById(payload.orderId);
    if (!order) return;
    if (order.deliveryId !== user.id) return;
    if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.OUT_FOR_DELIVERY) return;

    const lastPosRaw = await this.redisService.get(`delivery:lastpos:${payload.orderId}`);
    if (lastPosRaw) {
      const lastPos = JSON.parse(lastPosRaw);
      const distance = haversineDistance(
        lastPos.latitude, lastPos.longitude,
        payload.latitude, payload.longitude,
      );
      if (distance < 5) return;
    }

    const point = {
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: new Date().toISOString(),
    };
    const pointStr = JSON.stringify(point);

    await this.redisService.rpush(`delivery:track:${payload.orderId}`, pointStr);
    await this.redisService.set(`delivery:lastpos:${payload.orderId}`, pointStr);
    await this.redisService.expire(`delivery:track:${payload.orderId}`, 86400);
    await this.redisService.expire(`delivery:lastpos:${payload.orderId}`, 86400);

    this.server.to(payload.orderId).emit('delivery.location.updated', {
      orderId: payload.orderId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp: point.timestamp,
    });
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
    const authHeader = client.handshake.headers.authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return client.handshake.auth?.token ?? null;
  }
}
