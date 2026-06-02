import { IsString, IsOptional, MaxLength, Allow, IsNumber, Min } from 'class-validator';

export class UpdatePublicationDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @Allow()
  @IsOptional()
  imageUrlsToDelete?: any;
}
