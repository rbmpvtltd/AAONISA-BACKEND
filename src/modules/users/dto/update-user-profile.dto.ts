// import {IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

// export class UpdateUserProfileDto{

//     @IsOptional()
//     bio: string;

//     @IsString()
//     @IsOptional()
//     name: string;

//     @IsOptional()
//     @IsString()
//     username?: string;

//     @IsOptional()
//     @IsString()
//     url?: string

//     @IsBoolean()
//     imageChanged: string;

//     @IsOptional()
//     @IsString()
//     ProfilePicture?: string
// }

import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateUserProfileDto {

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

    @IsOptional()
    @IsString()
    imageChanged: string;

    @IsOptional()
    @IsString() 
    ProfilePicture?: string;
}