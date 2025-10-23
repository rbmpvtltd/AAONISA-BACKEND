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
    @Post('createBookmark')
    create(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.create(userId, createBookmarkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('updateBookmark')
    update(@Body() updateBookmarkDto: UpdateBookmarkDto, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.update(userId, updateBookmarkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('findAllBookmarks')
    findAll(@Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.findAll(userId);
    }


    // @UseGuards(JwtAuthGuard)
    // @Patch(':id')
    // update(
    //     @Param('id', ParseIntPipe) id: number,
    //     @Body() updateBookmarkDto: UpdateBookmarkDto,
    //     @Req() req,
    // ) {
    //     const payload = req.user;
    //     const userId = payload?.sub || payload?.id || payload?.userId;
    //     return this.bookmarkService.update(userId, id, updateBookmarkDto);
    // }

    @UseGuards(JwtAuthGuard)
    @Delete('deleteBookmark/:id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.remove(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getReelsOfBookmark/:id')
    findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.findOne(userId, id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('addReelToBookmark')
    addReel(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.addReel(userId, createBookmarkDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('removeReelFromBookmark')
    removeReel(@Body() createBookmarkDto: CreateBookmarkDto, @Req() req) {
        const payload = req.user;
        const userId = payload?.sub || payload?.id || payload?.userId;
        return this.bookmarkService.addReel(userId, createBookmarkDto);
    }
}
