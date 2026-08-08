import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InterestsService } from './interests.service';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('listings')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Post(':id/interest')
  markInterested(@Param('id') id: string, @CurrentUser() user: User) {
    return this.interestsService.markInterested(id, user);
  }

  @Get(':id/interest')
  findByListing(@Param('id') id: string, @CurrentUser() user: User) {
    return this.interestsService.findByListing(id, user);
  }
}
