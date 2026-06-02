import { IsString, IsNotEmpty } from 'class-validator';

export class GetCommentsQueryDto {
  @IsString()
  @IsNotEmpty()
  publicationId: string;
}