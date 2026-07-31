import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';
import { TenancyStatus } from '../../common/enums/tenancy-status.enum';

@Entity('tenancies')
export class Tenancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: User;

  @Column({ name: 'date_debut', type: 'date' })
  dateDebut: string;

  @Column({ name: 'date_fin', type: 'date', nullable: true })
  dateFin: string | null;

  @Column({ name: 'loyer_mensuel', type: 'decimal', precision: 10, scale: 2 })
  loyerMensuel: number;

  // Jour du mois où le loyer est dû (ex: 1 = le 1er de chaque mois)
  @Column({ name: 'jour_echeance', type: 'int', default: 1 })
  jourEcheance: number;

  @Column({
    type: 'enum',
    enum: TenancyStatus,
    default: TenancyStatus.ACTIVE,
  })
  statut: TenancyStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
