import { IsEmail, IsString } from 'class-validator';


export class UpdateEmailOtp {
    @IsEmail()
    email: string;

}

export class UpdatePhoneOtp {
    @IsString()
    phone: string;
}
export class UpdateUserEmail {
    @IsEmail()
    email: string;

    @IsString()
    otp: string;
}

export class UpdateUserPhone {
    @IsString()
    phone: string;

    @IsString()
    otp: string;
}
