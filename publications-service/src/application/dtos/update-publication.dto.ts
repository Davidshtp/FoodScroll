import { IsString, IsOptional, MaxLength, Allow } from 'class-validator';

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

  @Allow()
  @IsOptional()
  imageUrlsToDelete?: any;
}
