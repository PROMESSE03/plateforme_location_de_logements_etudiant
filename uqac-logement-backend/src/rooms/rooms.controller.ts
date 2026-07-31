import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('listings/:listingId/rooms')
  create(
    @Param('listingId') listingId: string,
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: User,
  ) {
    return this.roomsService.create(listingId, dto, user);
  }

  @Get('listings/:listingId/rooms')
  findByListing(
    @Param('listingId') listingId: string,
    @CurrentUser() user: User,
  ) {
    return this.roomsService.findByListing(listingId, user);
  }

  @Get('rooms/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.roomsService.findOne(id, user);
  }

  @Patch('rooms/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
    @CurrentUser() user: User,
  ) {
    return this.roomsService.update(id, dto, user);
  }

  @Delete('rooms/:id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.roomsService.remove(id, user);
  }
}
