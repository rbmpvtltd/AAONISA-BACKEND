import { IsBoolean, IsEmail, IsNotEmpty, IsOptional,IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StarLevel } from '../entities/user-profile.entity';
export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'user' })
    userName: string;

    @IsEmail()
    @ApiProperty({ example: '0123456789' })
    mobileNumber: string;

    @ApiProperty({ example: 'password1234' })
    password: string;

    @IsBoolean()
    paid: boolean;

    @IsString()
    role: string;

    @IsOptional()
    @IsEnum(StarLevel)
    star?: StarLevel= StarLevel.none;
}
