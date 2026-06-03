import { IsUUID, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  @IsNotEmpty()
  publicationId: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observation?: string;
}
