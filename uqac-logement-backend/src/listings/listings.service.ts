import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { ListingPhoto } from './entities/listing-photo.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { StatutAnnonce } from '../common/enums/statut-annonce.enum';
import { RoleType } from '../common/enums/role.enum';
import { UQAC_COORDS } from '../common/constants/uqac-coords';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingsRepo: Repository<Listing>,
    @InjectRepository(ListingPhoto)
    private readonly photosRepo: Repository<ListingPhoto>,
    private readonly usersService: UsersService,
  ) {}

  isAdmin(user: User): boolean {
    return user.roles.some((r) => r.role === RoleType.ADMIN);
  }

  isOwnerOf(listing: Listing, user: User): boolean {
    return listing.owner.id === user.id;
  }

  // Utilisé par d'autres modules (ex: rooms) qui ont besoin de vérifier
  // la propriété d'une annonce, peu importe son statut de validation.
  async findAnyByIdOrFail(id: string): Promise<Listing> {
    return this.findByIdOrFail(id);
  }

  // Publier une annonce ajoute automatiquement le rôle ROLE_OWNER
  // si l'utilisateur ne l'a pas déjà (cf. décision prise plus tôt).
  async create(dto: CreateListingDto, user: User): Promise<Listing> {
    await this.usersService.addRole(user.id, RoleType.OWNER);

    const listing = this.listingsRepo.create({
      ...dto,
      owner: user,
      statut: StatutAnnonce.EN_ATTENTE,
    });
    return this.listingsRepo.save(listing);
  }

  // Recherche publique : uniquement les annonces approuvées,
  // avec filtres optionnels (prix, type, chambres, distance de l'UQAC).
  async search(filters: SearchListingsDto): Promise<Listing[]> {
    const qb = this.listingsRepo
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.owner', 'owner')
      .leftJoinAndSelect('listing.photos', 'photos')
      .where('listing.statut = :statut', { statut: StatutAnnonce.APPROUVEE });

    if (filters.prix_min !== undefined) {
      qb.andWhere('listing.prix >= :prixMin', { prixMin: filters.prix_min });
    }
    if (filters.prix_max !== undefined) {
      qb.andWhere('listing.prix <= :prixMax', { prixMax: filters.prix_max });
    }
    if (filters.type_logement) {
      qb.andWhere('listing.type_logement = :typeLogement', {
        typeLogement: filters.type_logement,
      });
    }
    if (filters.nb_chambres_min !== undefined) {
      qb.andWhere('listing.nb_chambres >= :nbChambresMin', {
        nbChambresMin: filters.nb_chambres_min,
      });
    }

    if (filters.distance_km !== undefined) {
      // Formule de Haversine directement en SQL : distance en km entre
      // chaque annonce et le campus de l'UQAC. Suffisant pour le MVP ;
      // à terme, une colonne géométrique PostGIS + ST_DWithin sera plus
      // performante sur un grand volume d'annonces.
      qb.andWhere(
        `(
          6371 * acos(
            cos(radians(:uqacLat)) * cos(radians(listing.latitude)) *
            cos(radians(listing.longitude) - radians(:uqacLng)) +
            sin(radians(:uqacLat)) * sin(radians(listing.latitude))
          )
        ) <= :distanceKm`,
        {
          uqacLat: UQAC_COORDS.latitude,
          uqacLng: UQAC_COORDS.longitude,
          distanceKm: filters.distance_km,
        },
      );
    }

    return qb.getMany();
  }

  async findApprovedById(id: string): Promise<Listing> {
    const listing = await this.listingsRepo.findOne({
      where: { id, statut: StatutAnnonce.APPROUVEE },
    });
    if (!listing) {
      throw new NotFoundException('Annonce introuvable');
    }
    return listing;
  }

  async findMine(user: User): Promise<Listing[]> {
    return this.listingsRepo.find({
      where: { owner: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  private async findByIdOrFail(id: string): Promise<Listing> {
    const listing = await this.listingsRepo.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException('Annonce introuvable');
    }
    return listing;
  }

  async update(
    id: string,
    dto: UpdateListingDto,
    user: User,
  ): Promise<Listing> {
    const listing = await this.findByIdOrFail(id);
    if (!this.isOwnerOf(listing, user) && !this.isAdmin(user)) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres annonces',
      );
    }
    Object.assign(listing, dto);
    return this.listingsRepo.save(listing);
  }

  async remove(id: string, user: User): Promise<void> {
    const listing = await this.findByIdOrFail(id);
    if (!this.isOwnerOf(listing, user) && !this.isAdmin(user)) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres annonces',
      );
    }
    await this.listingsRepo.remove(listing);
  }

  // Réservé aux admins (protégé par RolesGuard dans le contrôleur)
  async approve(id: string): Promise<Listing> {
    const listing = await this.findByIdOrFail(id);
    listing.statut = StatutAnnonce.APPROUVEE;
    return this.listingsRepo.save(listing);
  }

  async reject(id: string): Promise<Listing> {
    const listing = await this.findByIdOrFail(id);
    listing.statut = StatutAnnonce.REJETEE;
    return this.listingsRepo.save(listing);
  }

  // Vue admin : toutes les annonces en attente, tous propriétaires confondus
  async findPending(): Promise<Listing[]> {
    return this.listingsRepo.find({
      where: { statut: StatutAnnonce.EN_ATTENTE },
      order: { createdAt: 'ASC' },
    });
  }

  async addPhotos(id: string, user: User, urls: string[]): Promise<Listing> {
    const listing = await this.findByIdOrFail(id);
    if (!this.isOwnerOf(listing, user) && !this.isAdmin(user)) {
      throw new ForbiddenException(
        "Vous ne pouvez ajouter des photos qu'à vos propres annonces",
      );
    }

    const startOrdre = listing.photos?.length ?? 0;
    const newPhotos = urls.map((url, index) =>
      this.photosRepo.create({ listing, url, ordre: startOrdre + index }),
    );
    await this.photosRepo.save(newPhotos);
    return this.findByIdOrFail(id);
  }

  async removePhoto(
    id: string,
    photoId: string,
    user: User,
  ): Promise<Listing> {
    const listing = await this.findByIdOrFail(id);
    if (!this.isOwnerOf(listing, user) && !this.isAdmin(user)) {
      throw new ForbiddenException(
        "Vous ne pouvez supprimer que les photos de vos propres annonces",
      );
    }

    const photo = listing.photos?.find((p) => p.id === photoId);
    if (!photo) {
      throw new NotFoundException('Photo introuvable sur cette annonce');
    }

    await this.photosRepo.remove(photo);
    return this.findByIdOrFail(id);
  }
}
