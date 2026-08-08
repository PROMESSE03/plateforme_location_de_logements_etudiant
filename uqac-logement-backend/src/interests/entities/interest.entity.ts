import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';
import { User } from '../../users/entities/user.entity';

@Entity('interests')
@Unique(['listing', 'tenant']) // un locataire ne peut marquer son intérêt qu'une fois par annonce
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
