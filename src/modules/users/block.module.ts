import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './entities/block.entity';
import { BlockService } from './block.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Block, User])],
  providers: [BlockService],
  exports: [BlockService, TypeOrmModule],
})
export class BlockModule {}
