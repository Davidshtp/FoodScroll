import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  authorization?: string;
}
