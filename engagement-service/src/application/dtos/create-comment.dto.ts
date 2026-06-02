import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  publicationId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}