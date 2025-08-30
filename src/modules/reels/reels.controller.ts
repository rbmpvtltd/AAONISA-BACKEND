import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReelsService } from './reels.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';

@Controller('reels')
export class ReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Post()
  create(@Body() createReelDto: CreateReelDto) {
    return this.reelsService.create(createReelDto);
  }

  @Get()
  findAll() {
    return this.reelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reelsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReelDto: UpdateReelDto) {
    return this.reelsService.update(+id, updateReelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reelsService.remove(+id);
  }
}
