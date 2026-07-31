import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenancy } from './entities/tenancy.entity';
import { TenanciesService } from './tenancies.service';
import { TenanciesController } from './tenancies.controller';
import { RoomsModule } from '../rooms/rooms.module';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenancy]),
    RoomsModule,
    ListingsModule,
    UsersModule,
  ],
  controllers: [TenanciesController],
  providers: [TenanciesService],
  exports: [TenanciesService],
})
export class TenanciesModule {}
