import { IsString, IsNotEmpty } from 'class-validator';

export class AssignTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
