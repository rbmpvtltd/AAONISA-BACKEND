import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ example: 'user' })
    name: string;

    @IsEmail()
    @ApiProperty({ example: '0123456789' })
    mobileNumber: string;

    @ApiProperty({ example: 'password1234' })
    password: string;
}
