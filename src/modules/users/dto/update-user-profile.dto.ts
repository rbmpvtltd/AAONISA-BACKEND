import {IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto{

    @IsOptional()
    bio: string;

    @IsString()
    @IsOptional()
    name: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsString()
    url?: string
}