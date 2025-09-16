import {IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserProfileDto{
    // @IsNotEmpty()
    // @IsString()
    // token: string

    @IsOptional()
    profilePicture: string;

    @IsOptional()
    bio: string;

    @IsString()
    @IsOptional()
    name: string;

    @IsOptional()
    @IsString()
    username?: string;

}