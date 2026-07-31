import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ListingPhoto } from './listing-photo.entity';
import { StatutAnnonce } from '../../common/enums/statut-annonce.enum';

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix: number;

  @Column()
  adresse: string;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ name: 'type_logement' })
  typeLogement: string;

  @Column({ name: 'nb_chambres', type: 'int' })
  nbChambres: number;

  @Column({ name: 'disponible_a', type: 'date', nullable: true })
  disponibleA: string;

  @Column({
    type: 'enum',
    enum: StatutAnnonce,
    default: StatutAnnonce.EN_ATTENTE,
  })
  statut: StatutAnnonce;

  @OneToMany(() => ListingPhoto, (photo) => photo.listing, {
    eager: true,
    cascade: true,
  })
  photos: ListingPhoto[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
