import { IsNumber, IsString } from "class-validator";
import { CreateDateColumn } from "typeorm";

export class CreateCommentDto {
    @IsNumber()
    user_id: number

    @IsNumber()
    post_id: number

    @IsString()
    comment: string
}
