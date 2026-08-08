import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interest } from './entities/interest.entity';
import { InterestsService } from './interests.service';
import { InterestsController } from './interests.controller';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Interest]), ListingsModule],
  controllers: [InterestsController],
  providers: [InterestsService],
})
export class InterestsModule {}
