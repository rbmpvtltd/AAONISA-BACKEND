import { Module } from '@nestjs/common';
import { AppGateway } from 'src/app.gateway';

@Module({
  providers: [AppGateway],
  exports: [AppGateway],
})
export class SharedModule {}
