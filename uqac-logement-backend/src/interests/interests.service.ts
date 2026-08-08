import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interest } from './entities/interest.entity';
import { User } from '../users/entities/user.entity';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class InterestsService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestsRepo: Repository<Interest>,
    private readonly listingsService: ListingsService,
  ) {}

  // Idempotent : si le locataire a déjà marqué son intérêt, on ne
  // duplique pas, on renvoie simplement l'entrée existante.
  async markInterested(listingId: string, tenant: User): Promise<Interest> {
    const listing = await this.listingsService.findAnyByIdOrFail(listingId);

    const existing = await this.interestsRepo.findOne({
      where: { listing: { id: listingId }, tenant: { id: tenant.id } },
    });
    if (existing) {
      return existing;
    }

    const interest = this.interestsRepo.create({ listing, tenant });
    return this.interestsRepo.save(interest);
  }

  async findByListing(listingId: string, user: User): Promise<Interest[]> {
    const listing = await this.listingsService.findAnyByIdOrFail(listingId);
    if (
      !this.listingsService.isOwnerOf(listing, user) &&
      !this.listingsService.isAdmin(user)
    ) {
      throw new ForbiddenException(
        "Vous ne pouvez voir les intéressés que de vos propres annonces",
      );
    }
    return this.interestsRepo.find({
      where: { listing: { id: listingId } },
      order: { createdAt: 'DESC' },
    });
  }
}
