import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenancy } from './entities/tenancy.entity';
import { Room } from '../rooms/entities/room.entity';
import { CreateTenancyDto } from './dto/create-tenancy.dto';
import { RoomStatus } from '../common/enums/room-status.enum';
import { TenancyStatus } from '../common/enums/tenancy-status.enum';
import { User } from '../users/entities/user.entity';
import { RoomsService } from '../rooms/rooms.service';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TenanciesService {
  constructor(
    @InjectRepository(Tenancy)
    private readonly tenanciesRepo: Repository<Tenancy>,
    private readonly roomsService: RoomsService,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
  ) {}

  private canManageRoom(room: Room, user: User): boolean {
    return (
      this.listingsService.isOwnerOf(room.listing, user) ||
      this.listingsService.isAdmin(user)
    );
  }

  async create(
    roomId: string,
    dto: CreateTenancyDto,
    user: User,
  ): Promise<Tenancy> {
    const room = await this.roomsService.findRoomEntityOrFail(roomId);
    if (!this.canManageRoom(room, user)) {
      throw new ForbiddenException(
        'Vous ne pouvez louer que les chambres de vos propres annonces',
      );
    }
    if (room.statut === RoomStatus.OCCUPEE) {
      throw new BadRequestException('Cette chambre est déjà occupée');
    }

    const tenant = await this.usersService.findByEmail(dto.tenantEmail);
    if (!tenant) {
      throw new NotFoundException(
        "Aucun compte n'existe avec cet email. Le locataire doit d'abord créer un compte.",
      );
    }

    const tenancy = this.tenanciesRepo.create({
      room,
      tenant,
      dateDebut: dto.dateDebut,
      loyerMensuel: dto.loyerMensuel,
      jourEcheance: dto.jourEcheance ?? 1,
      statut: TenancyStatus.ACTIVE,
    });
    const saved = await this.tenanciesRepo.save(tenancy);

    room.statut = RoomStatus.OCCUPEE;
    await this.roomsService.save(room);

    // On recharge depuis la base plutôt que de renvoyer `saved` directement :
    // ça garantit que room.statut reflète bien "occupee" dans la réponse,
    // peu importe si TypeORM a renvoyé une copie ou la même référence.
    return this.findByIdOrFail(saved.id);
  }

  private async findByIdOrFail(id: string): Promise<Tenancy> {
    const tenancy = await this.tenanciesRepo.findOne({ where: { id } });
    if (!tenancy) {
      throw new NotFoundException('Location introuvable');
    }
    return tenancy;
  }

  async findByRoom(roomId: string, user: User): Promise<Tenancy[]> {
    const room = await this.roomsService.findRoomEntityOrFail(roomId);
    if (!this.canManageRoom(room, user)) {
      throw new ForbiddenException(
        'Vous ne pouvez consulter que les locations de vos propres chambres',
      );
    }
    return this.tenanciesRepo.find({
      where: { room: { id: roomId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Vue du locataire : ses propres locations, passées et actuelles
  async findMine(user: User): Promise<Tenancy[]> {
    return this.tenanciesRepo.find({
      where: { tenant: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async terminate(id: string, user: User): Promise<Tenancy> {
    const tenancy = await this.findByIdOrFail(id);
    if (!this.canManageRoom(tenancy.room, user)) {
      throw new ForbiddenException(
        'Vous ne pouvez terminer que les locations de vos propres chambres',
      );
    }
    if (tenancy.statut === TenancyStatus.TERMINEE) {
      throw new BadRequestException('Cette location est déjà terminée');
    }

    tenancy.statut = TenancyStatus.TERMINEE;
    tenancy.dateFin = new Date().toISOString().slice(0, 10);
    const saved = await this.tenanciesRepo.save(tenancy);

    const room = await this.roomsService.findRoomEntityOrFail(
      tenancy.room.id,
    );
    room.statut = RoomStatus.DISPONIBLE;
    await this.roomsService.save(room);

    return saved;
  }
}
