import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { User } from '../users/entities/user.entity';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateListingDto, @CurrentUser() user: User) {
    return this.listingsService.create(dto, user);
  }

  // Recherche publique — pas d'authentification requise
  @Get()
  search(@Query() filters: SearchListingsDto) {
    return this.listingsService.search(filters);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: User) {
    return this.listingsService.findMine(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Get('admin/pending')
  findPending() {
    return this.listingsService.findPending();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findApprovedById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.listingsService.approve(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.listingsService.reject(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: User,
  ) {
    return this.listingsService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.listingsService.remove(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/photos')
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: './uploads/listings',
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);
        callback(null, isImage);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo par photo
    }),
  )
  addPhotos(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<{ filename: string }>,
  ) {
    const urls = files.map((f) => `/uploads/listings/${f.filename}`);
    return this.listingsService.addPhotos(id, user, urls);
  }
}
