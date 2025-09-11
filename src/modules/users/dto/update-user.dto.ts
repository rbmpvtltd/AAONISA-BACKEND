import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    token: string
    
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone_no?: string;

    @IsOptional()
    @IsString()
    username?: string;
}
