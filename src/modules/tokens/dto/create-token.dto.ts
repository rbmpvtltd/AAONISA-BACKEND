import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
