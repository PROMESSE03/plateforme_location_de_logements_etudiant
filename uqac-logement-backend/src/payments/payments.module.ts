import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Tenancy } from '../tenancies/entities/tenancy.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RoomsModule } from '../rooms/rooms.module';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Tenancy]),
    RoomsModule,
    ListingsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
