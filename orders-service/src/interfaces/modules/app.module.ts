import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { JWT_SECRET_KEY, DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME } from '../../infrastructure/config/constants';

// Domain
import { ORDER_REPOSITORY } from '../../domain/repositories/order.repository';
import { CART_REPOSITORY } from '../../domain/repositories/cart.repository';

// Application
import { CreateOrderUseCase } from '../../application/usecases/order/create-order.usecase';
import { GetOrderUseCase } from '../../application/usecases/order/get-order.usecase';
import { GetUserOrdersUseCase } from '../../application/usecases/order/get-user-orders.usecase';
import { UpdateOrderStatusUseCase } from '../../application/usecases/order/update-order-status.usecase';
import { CancelOrderUseCase } from '../../application/usecases/order/cancel-order.usecase';
import { GetRestaurantOrdersUseCase } from '../../application/usecases/order/get-restaurant-orders.usecase';
import { GetAvailableOrdersUseCase } from '../../application/usecases/order/get-available-orders.usecase';
import { AcceptDeliveryUseCase } from '../../application/usecases/order/accept-delivery.usecase';
import { DeliverOrderUseCase } from '../../application/usecases/order/deliver-order.usecase';
import { GetMyDeliveriesUseCase } from '../../application/usecases/order/get-my-deliveries.usecase';
import { ConfirmOrderUseCase } from '../../application/usecases/order/confirm-order.usecase';
import { RejectOrderUseCase } from '../../application/usecases/order/reject-order.usecase';
import { StartPreparingUseCase } from '../../application/usecases/order/start-preparing.usecase';
import { MarkReadyUseCase } from '../../application/usecases/order/mark-ready.usecase';
import { PickupOrderUseCase } from '../../application/usecases/order/pickup-order.usecase';
import { GetCustomerOrderHistoryUseCase } from '../../application/usecases/order/get-customer-order-history.usecase';
import { GetRestaurantOrderHistoryUseCase } from '../../application/usecases/order/get-restaurant-order-history.usecase';
import { GetDeliveryOrderHistoryUseCase } from '../../application/usecases/order/get-delivery-order-history.usecase';
import { CustomerIdentityPort, CUSTOMER_IDENTITY_PORT } from '../../application/ports/customer-identity.port';
import { PublicationPort, PUBLICATION_PORT } from '../../application/ports/publication.port';
import { RestaurantPort, RESTAURANT_PORT } from '../../application/ports/restaurant.port';
import { RestaurantInfoPort, RESTAURANT_INFO_PORT } from '../../application/ports/restaurant-info.port';
import { CustomerInfoPort, CUSTOMER_INFO_PORT } from '../../application/ports/customer-info.port';
import { LocationPort, LOCATION_PORT } from '../../application/ports/location.port';
import { DeliveryInfoPort, DELIVERY_INFO_PORT } from '../../application/ports/delivery-info.port';
import { AddToCartUseCase } from '../../application/usecases/cart/add-to-cart.usecase';
import { GetCartUseCase } from '../../application/usecases/cart/get-cart.usecase';
import { UpdateCartItemUseCase } from '../../application/usecases/cart/update-cart-item.usecase';
import { RemoveFromCartUseCase } from '../../application/usecases/cart/remove-from-cart.usecase';
import { ClearCartUseCase } from '../../application/usecases/cart/clear-cart.usecase';
import { CheckoutCartUseCase } from '../../application/usecases/cart/checkout-cart.usecase';

// Infrastructure
import { TypeOrmOrderRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-order.repository';
import { TypeOrmCartRepository } from '../../infrastructure/persistence/typeorm/repositories/typeorm-cart.repository';
import { OrderOrmEntity } from '../../infrastructure/persistence/typeorm/entities/order.orm-entity';
import { OrderItemOrmEntity } from '../../infrastructure/persistence/typeorm/entities/order-item.orm-entity';
import { CartOrmEntity } from '../../infrastructure/persistence/typeorm/entities/cart.orm-entity';
import { CartItemOrmEntity } from '../../infrastructure/persistence/typeorm/entities/cart-item.orm-entity';
import { IdentityServiceClient } from '../../infrastructure/http/identity-service.client';
import { PublicationServiceClient } from '../../infrastructure/http/publication-service.client';
import { RestaurantServiceClient } from '../../infrastructure/http/restaurant-service.client';
import { RestaurantInfoClient } from '../../infrastructure/http/restaurant-info.client';
import { CustomerInfoClient } from '../../infrastructure/http/customer-info.client';
import { LocationClient } from '../../infrastructure/http/location.client';
import { DeliveryInfoClient } from '../../infrastructure/http/delivery-info.client';

// Interfaces
import { OrderController } from '../http/controllers/order.controller';
import { CartController } from '../http/controllers/cart.controller';
import { OrderGateway } from '../http/gateways/order.gateway';
import { JwtStrategy } from '../http/strategies/jwt.strategy';
import { DomainExceptionFilter } from '../http/filters/domain-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get(DATABASE_HOST, 'localhost'),
        port: config.get<number>(DATABASE_PORT, 3306),
        username: config.get(DATABASE_USERNAME, 'root'),
        password: config.get(DATABASE_PASSWORD, ''),
        database: config.get(DATABASE_NAME, 'feedgo_orders'),
        entities: [OrderOrmEntity, OrderItemOrmEntity, CartOrmEntity, CartItemOrmEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity, CartOrmEntity, CartItemOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(JWT_SECRET_KEY),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OrderController, CartController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    OrderGateway,
    JwtStrategy,
    CreateOrderUseCase,
    GetOrderUseCase,
    GetUserOrdersUseCase,
    UpdateOrderStatusUseCase,
    CancelOrderUseCase,
    GetRestaurantOrdersUseCase,
    GetAvailableOrdersUseCase,
    AcceptDeliveryUseCase,
    DeliverOrderUseCase,
    GetMyDeliveriesUseCase,
    ConfirmOrderUseCase,
    RejectOrderUseCase,
    StartPreparingUseCase,
    MarkReadyUseCase,
    PickupOrderUseCase,
    GetCustomerOrderHistoryUseCase,
    GetRestaurantOrderHistoryUseCase,
    GetDeliveryOrderHistoryUseCase,
    AddToCartUseCase,
    GetCartUseCase,
    UpdateCartItemUseCase,
    RemoveFromCartUseCase,
    ClearCartUseCase,
    CheckoutCartUseCase,
    {
      provide: ORDER_REPOSITORY,
      useClass: TypeOrmOrderRepository,
    },
    {
      provide: CART_REPOSITORY,
      useClass: TypeOrmCartRepository,
    },
    {
      provide: CUSTOMER_IDENTITY_PORT,
      useClass: IdentityServiceClient,
    },
    {
      provide: PUBLICATION_PORT,
      useClass: PublicationServiceClient,
    },
    {
      provide: RESTAURANT_PORT,
      useClass: RestaurantServiceClient,
    },
    {
      provide: RESTAURANT_INFO_PORT,
      useClass: RestaurantInfoClient,
    },
    {
      provide: CUSTOMER_INFO_PORT,
      useClass: CustomerInfoClient,
    },
    {
      provide: LOCATION_PORT,
      useClass: LocationClient,
    },
    {
      provide: DELIVERY_INFO_PORT,
      useClass: DeliveryInfoClient,
    },
  ],
})
export class AppModule {}
