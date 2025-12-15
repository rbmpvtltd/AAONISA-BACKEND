import { Module } from '@nestjs/common';
import { AppGateway } from 'src/app.gateway';
import { ViewModule } from '../views/view.module';
import { TokenModule } from '../tokens/token.module';
import { UserProfileModule } from '../users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
@Module({
  imports: [ViewModule, TokenModule,UserProfileModule,TypeOrmModule.forFeature([User]),],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class SharedModule {}
