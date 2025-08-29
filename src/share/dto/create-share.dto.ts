import { IsIn, IsInt, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateShareDto {
  @IsNotEmpty()
  @IsInt()
  user_id: number;

  @IsNotEmpty()
  @IsInt()
  post_id: number;
}