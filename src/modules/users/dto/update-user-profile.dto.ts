import {IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto{
    @IsNotEmpty()
    @IsString()
    token: string

    @IsOptional()
    avatar: string;

    @IsOptional()
    bio: string;
}