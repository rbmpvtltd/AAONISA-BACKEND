// src/view/view.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { View } from './entities/view.entity';
import { ViewService } from './view.service';
import { ViewController } from './view.controller';
@Module({
  imports: [TypeOrmModule.forFeature([View])],
  providers: [ViewService],
  controllers: [ViewController],
  exports:[ViewService]
})
export class ViewModule {}
