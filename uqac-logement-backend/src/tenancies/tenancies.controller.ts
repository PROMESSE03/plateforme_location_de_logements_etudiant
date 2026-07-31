import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenanciesService } from './tenancies.service';
import { CreateTenancyDto } from './dto/create-tenancy.dto';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class TenanciesController {
  constructor(private readonly tenanciesService: TenanciesService) {}

  @Post('rooms/:roomId/tenancies')
  create(
    @Param('roomId') roomId: string,
    @Body() dto: CreateTenancyDto,
    @CurrentUser() user: User,
  ) {
    return this.tenanciesService.create(roomId, dto, user);
  }

  @Get('rooms/:roomId/tenancies')
  findByRoom(@Param('roomId') roomId: string, @CurrentUser() user: User) {
    return this.tenanciesService.findByRoom(roomId, user);
  }

  @Get('tenancies/mine')
  findMine(@CurrentUser() user: User) {
    return this.tenanciesService.findMine(user);
  }

  @Patch('tenancies/:id/terminate')
  terminate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tenanciesService.terminate(id, user);
  }
}
