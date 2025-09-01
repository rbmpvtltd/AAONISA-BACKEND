import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';

@Controller('reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  //  Reels Module
// Upload new reel
  @Post()
  uploadNewReel(@Body() createReelDto: CreateReelDto) {
    return this.reelsService.uploadNewReel(createReelDto);
  }

  //  Get single reel
  @Get(':id')
  getSingleReel(@Param('id') id: number) {
    return this.reelsService.getSingleReel(id);
  }

  //  Get recommended reels (paginated)
  @Get('/feed')
  getRecommended(@Param('feed') feed: string ) {
    return this.reelsService.findOne(+feed);
  }
  
  // Delete reel
    @Delete(':id')
    deleteReel(@Param('id') id: number) {
      return this.reelsService.deleteReel(+id);
    }

  @Post(':id/share')
  shareReels(@Param('id') id: number) {
    return this.reelsService.shareReels(id);
  }
}
