import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors, ParseUUIDPipe, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserId } from '../decorators/user-id.decorator';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AddToCartUseCase } from '../../../application/usecases/cart/add-to-cart.usecase';
import { GetCartUseCase } from '../../../application/usecases/cart/get-cart.usecase';
import { UpdateCartItemUseCase } from '../../../application/usecases/cart/update-cart-item.usecase';
import { RemoveFromCartUseCase } from '../../../application/usecases/cart/remove-from-cart.usecase';
import { ClearCartUseCase } from '../../../application/usecases/cart/clear-cart.usecase';
import { CheckoutCartUseCase } from '../../../application/usecases/cart/checkout-cart.usecase';
import { AddToCartDto } from '../dtos/add-to-cart.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';

@Controller('cart')
@UseInterceptors(LoggingInterceptor)
export class CartController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly getCartUseCase: GetCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeFromCartUseCase: RemoveFromCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly checkoutCartUseCase: CheckoutCartUseCase,
  ) {}

  @Post('items')
  @UseGuards(JwtAuthGuard)
  async addItem(
    @UserId() userId: string,
    @Body() dto: AddToCartDto,
    @Headers('Authorization') authorization: string,
  ) {
    return this.addToCartUseCase.execute({
      customerId: userId,
      publicationId: dto.publicationId,
      quantity: dto.quantity,
      observation: dto.observation,
      authorization: authorization ?? '',
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@UserId() userId: string) {
    return this.getCartUseCase.execute({ customerId: userId });
  }

  @Patch('items/:cartItemId')
  @UseGuards(JwtAuthGuard)
  async updateItem(
    @UserId() userId: string,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.updateCartItemUseCase.execute({
      customerId: userId,
      cartItemId,
      quantity: dto.quantity,
      observation: dto.observation,
    });
  }

  @Delete('items/:cartItemId')
  @UseGuards(JwtAuthGuard)
  async removeItem(
    @UserId() userId: string,
    @Param('cartItemId', ParseUUIDPipe) cartItemId: string,
  ) {
    return this.removeFromCartUseCase.execute({
      customerId: userId,
      cartItemId,
    });
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async clearCart(@UserId() userId: string) {
    return this.clearCartUseCase.execute({ customerId: userId });
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async checkout(
    @UserId() userId: string,
    @Body() body: { customerAddressId: string },
    @Headers('Authorization') authorization: string,
  ) {
    return this.checkoutCartUseCase.execute({
      customerId: userId,
      customerAddressId: body.customerAddressId,
      authorization: authorization ?? '',
    });
  }
}
