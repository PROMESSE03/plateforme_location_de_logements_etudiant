import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { User } from '../users/entities/user.entity';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomsRepo: Repository<Room>,
    private readonly listingsService: ListingsService,
  ) {}

  private async findByIdOrFail(id: string): Promise<Room> {
    const room = await this.roomsRepo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('Chambre introuvable');
    }
    return room;
  }

  private assertCanManage(room: Room, user: User): void {
    const isOwner = this.listingsService.isOwnerOf(room.listing, user);
    if (!isOwner && !this.listingsService.isAdmin(user)) {
      throw new ForbiddenException(
        'Vous ne pouvez gérer que les chambres de vos propres annonces',
      );
    }
  }

  async create(
    listingId: string,
    dto: CreateRoomDto,
    user: User,
  ): Promise<Room> {
    const listing = await this.listingsService.findAnyByIdOrFail(listingId);
    if (
      !this.listingsService.isOwnerOf(listing, user) &&
      !this.listingsService.isAdmin(user)
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez ajouter des chambres qu'à vos propres annonces",
      );
    }

    const room = this.roomsRepo.create({ ...dto, listing });
    return this.roomsRepo.save(room);
  }

  async findByListing(listingId: string, user: User): Promise<Room[]> {
    const listing = await this.listingsService.findAnyByIdOrFail(listingId);
    if (
      !this.listingsService.isOwnerOf(listing, user) &&
      !this.listingsService.isAdmin(user)
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que les chambres de vos propres annonces',
      );
    }
    return this.roomsRepo.find({ where: { listing: { id: listingId } } });
  }

  async findOne(id: string, user: User): Promise<Room> {
    const room = await this.findByIdOrFail(id);
    this.assertCanManage(room, user);
    return room;
  }

  async update(id: string, dto: UpdateRoomDto, user: User): Promise<Room> {
    const room = await this.findByIdOrFail(id);
    this.assertCanManage(room, user);
    Object.assign(room, dto);
    return this.roomsRepo.save(room);
  }

  async remove(id: string, user: User): Promise<void> {
    const room = await this.findByIdOrFail(id);
    this.assertCanManage(room, user);
    await this.roomsRepo.remove(room);
  }

  // Utilisé par le module tenancies pour changer le statut disponible/occupee
  async save(room: Room): Promise<Room> {
    return this.roomsRepo.save(room);
  }

  async findRoomEntityOrFail(id: string): Promise<Room> {
    return this.findByIdOrFail(id);
  }
}
