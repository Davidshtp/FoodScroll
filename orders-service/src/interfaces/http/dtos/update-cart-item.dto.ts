import { IsNumber, IsPositive, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observation?: string;
}
