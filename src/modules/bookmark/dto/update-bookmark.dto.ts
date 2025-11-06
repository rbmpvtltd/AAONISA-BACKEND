
import { PartialType } from '@nestjs/mapped-types';
import { CreateBookmarkDto } from './create-bookmark.dto';
import { IsNumber } from 'class-validator';

export class UpdateBookmarkDto extends PartialType(CreateBookmarkDto) {
    @IsNumber()
    id: number
}
