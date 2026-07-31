import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Listing } from '../../listings/entities/listing.entity';
import { RoomStatus } from '../../common/enums/room-status.enum';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Listing, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: Listing;

  @Column()
  nom: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix: number;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.DISPONIBLE })
  statut: RoomStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
