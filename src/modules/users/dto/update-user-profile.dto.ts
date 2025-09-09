import { IsBoolean, IsEmail, IsNotEmpty, IsOptional,IsEnum, IsString, MinLength } from 'class-validator';
import { CreateUserProfileDto } from './create-user-profile.dto';

export class UpdateUserProfileDto{
    @IsNotEmpty()
    @IsString()
    token: string

    @IsOptional()
    avatar: string;

    @IsOptional()
    bio: string;
}