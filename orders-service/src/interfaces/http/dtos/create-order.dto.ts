import { IsString, IsNotEmpty, IsUUID, IsArray, ValidateNested, IsNumber, IsPositive, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  publicationId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observation?: string;
}

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  customerAddressId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  authorization?: string;
}