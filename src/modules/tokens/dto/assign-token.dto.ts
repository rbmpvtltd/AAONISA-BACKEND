import { IsString, IsUUID } from 'class-validator';

export class AssignTokenDto {
  @IsUUID()
  userId: string;

  @IsString()
  token: string;
}
