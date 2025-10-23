import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Req,
    UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { UpdateBookmarkDto } from './dto/update-bookmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('bookmarks')
export class BookmarkController {
    constructor(private readonly bookmarkService: BookmarkService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req) {
        const userId = req.user.id;
        return this.bookmarkService.create(userId, createBookmarkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req) {
        const userId = req.user.id;
        return this.bookmarkService.findAll(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const userId = req.user.id;
        return this.bookmarkService.findOne(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateBookmarkDto: UpdateBookmarkDto,
        @Req() req,
    ) {
        const userId = req.user.id;
        return this.bookmarkService.update(userId, id, updateBookmarkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const userId = req.user.id;
        return this.bookmarkService.remove(userId, id);
    }
}
