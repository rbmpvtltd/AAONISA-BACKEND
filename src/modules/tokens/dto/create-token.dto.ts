import { IsString } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  token: string;
}
