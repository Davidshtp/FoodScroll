import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePublicationDto {

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

}
