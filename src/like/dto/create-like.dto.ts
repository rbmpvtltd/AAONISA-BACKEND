import { IsNotEmpty, IsNumber } from "class-validator";

export class CreateLikeDto {
    @IsNotEmpty()
    @IsNumber()
    user_id : number;

    @IsNotEmpty()
    @IsNumber()
    post_id : number
}
