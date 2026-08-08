import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { RoomsModule } from './rooms/rooms.module';
import { TenanciesModule } from './tenancies/tenancies.module';
import { PaymentsModule } from './payments/payments.module';
import { InterestsModule } from './interests/interests.module';
import { User } from './users/entities/user.entity';
import { UserRole } from './users/entities/user-role.entity';
import { Listing } from './listings/entities/listing.entity';
import { ListingPhoto } from './listings/entities/listing-photo.entity';
import { Room } from './rooms/entities/room.entity';
import { Tenancy } from './tenancies/entities/tenancy.entity';
import { Payment } from './payments/entities/payment.entity';
import { Interest } from './interests/entities/interest.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          User,
          UserRole,
          Listing,
          ListingPhoto,
          Room,
          Tenancy,
          Payment,
          Interest,
        ],
        // synchronize: true est pratique en développement (crée les tables
        // automatiquement à partir des entités) mais À DÉSACTIVER en
        // production au profit de vraies migrations TypeORM.
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ListingsModule,
    RoomsModule,
    TenanciesModule,
    PaymentsModule,
    InterestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
