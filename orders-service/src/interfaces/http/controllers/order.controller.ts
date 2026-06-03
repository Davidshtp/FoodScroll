import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, ParseUUIDPipe, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ServiceSecretGuard } from '../guards/service-secret.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserId } from '../decorators/user-id.decorator';
import { UserRole } from '../decorators/user-role.decorator';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { CreateOrderUseCase } from '../../../application/usecases/order/create-order.usecase';
import { GetOrderUseCase } from '../../../application/usecases/order/get-order.usecase';
import { GetUserOrdersUseCase } from '../../../application/usecases/order/get-user-orders.usecase';
import { UpdateOrderStatusUseCase } from '../../../application/usecases/order/update-order-status.usecase';
import { CancelOrderUseCase } from '../../../application/usecases/order/cancel-order.usecase';
import { GetRestaurantOrdersUseCase } from '../../../application/usecases/order/get-restaurant-orders.usecase';
import { GetAvailableOrdersUseCase } from '../../../application/usecases/order/get-available-orders.usecase';
import { AcceptDeliveryUseCase } from '../../../application/usecases/order/accept-delivery.usecase';
import { DeliverOrderUseCase } from '../../../application/usecases/order/deliver-order.usecase';
import { GetMyDeliveriesUseCase } from '../../../application/usecases/order/get-my-deliveries.usecase';
import { ConfirmOrderUseCase } from '../../../application/usecases/order/confirm-order.usecase';
import { RejectOrderUseCase } from '../../../application/usecases/order/reject-order.usecase';
import { StartPreparingUseCase } from '../../../application/usecases/order/start-preparing.usecase';
import { MarkReadyUseCase } from '../../../application/usecases/order/mark-ready.usecase';
import { PickupOrderUseCase } from '../../../application/usecases/order/pickup-order.usecase';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderStatusDto } from '../dtos/update-order-status.dto';

@Controller('orders')
@UseInterceptors(LoggingInterceptor)
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly getUserOrdersUseCase: GetUserOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly getRestaurantOrdersUseCase: GetRestaurantOrdersUseCase,
    private readonly getAvailableOrdersUseCase: GetAvailableOrdersUseCase,
    private readonly acceptDeliveryUseCase: AcceptDeliveryUseCase,
    private readonly deliverOrderUseCase: DeliverOrderUseCase,
    private readonly getMyDeliveriesUseCase: GetMyDeliveriesUseCase,
    private readonly confirmOrderUseCase: ConfirmOrderUseCase,
    private readonly rejectOrderUseCase: RejectOrderUseCase,
    private readonly startPreparingUseCase: StartPreparingUseCase,
    private readonly markReadyUseCase: MarkReadyUseCase,
    private readonly pickupOrderUseCase: PickupOrderUseCase,
  ) {}

  // ───── Customer endpoints ─────

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @UserId() userId: string,
    @Body() dto: CreateOrderDto,
    @Headers('Authorization') authorization: string,
  ) {
    return this.createOrderUseCase.execute({
      customerId: userId,
      customerAddressId: dto.customerAddressId,
      orderItems: dto.orderItems,
      authorization: authorization ?? dto.authorization ?? '',
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrders(@UserId() userId: string, @Headers('Authorization') authorization: string) {
    return this.getUserOrdersUseCase.execute({
      userId,
      authorization,
    });
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
  ) {
    return this.cancelOrderUseCase.execute({ orderId, userId });
  }

  // ───── Restaurant endpoints ─────

  @Get('restaurant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  async getRestaurantOrders(
    @UserId() userId: string,
    @UserRole() role: string,
    @Headers('Authorization') authorization: string,
  ) {
    return this.getRestaurantOrdersUseCase.execute({
      userId,
      role,
      authorization: authorization ?? '',
    });
  }

  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  async confirmOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.confirmOrderUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  async rejectOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.rejectOrderUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  @Post(':id/preparing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  async startPreparing(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.startPreparingUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  @Post(':id/ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT')
  async markReady(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.markReadyUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  // ───── Delivery endpoints ─────

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY')
  async getAvailableOrders(
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.getAvailableOrdersUseCase.execute({
      userId,
      role,
    });
  }

  @Get('my-deliveries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY')
  async getMyDeliveries(
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.getMyDeliveriesUseCase.execute({
      userId,
      role,
    });
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY')
  async acceptDelivery(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.acceptDeliveryUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  @Post(':id/pickup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY')
  async pickupOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.pickupOrderUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  @Post(':id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DELIVERY')
  async deliverOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
  ) {
    return this.deliverOrderUseCase.execute({
      orderId,
      userId,
      role,
    });
  }

  // ───── Internal endpoints (service-to-service) ─────

  @Put(':id/status')
  @UseGuards(ServiceSecretGuard)
  async updateStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute({
      orderId,
      userId: dto.userId,
      status: dto.status,
      authorization: dto.authorization ?? '',
    });
  }

  // ───── Shared endpoints ─────

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(
    @Param('id', ParseUUIDPipe) orderId: string,
    @UserId() userId: string,
    @UserRole() role: string,
    @Headers('Authorization') authorization: string,
  ) {
    return this.getOrderUseCase.execute({ orderId, userId, role, authorization: authorization ?? '' });
  }
}
