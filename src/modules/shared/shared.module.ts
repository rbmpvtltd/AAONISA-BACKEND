import { Module } from '@nestjs/common';
import { AppGateway } from 'src/app.gateway';
import { ViewModule } from '../views/view.module';
@Module({
  imports: [ViewModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class SharedModule {}
