import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenancy } from '../../tenancies/entities/tenancy.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenancy, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenancy_id' })
  tenancy: Tenancy;

  // Premier jour du mois concerné (ex: 2026-08-01 pour le loyer d'août)
  @Column({ type: 'date' })
  mois: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montant: number;

  @Column({ name: 'date_paiement', type: 'date', nullable: true })
  datePaiement: string | null;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  methode: PaymentMethod | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.EN_ATTENTE,
  })
  statut: PaymentStatus;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'enregistre_par' })
  enregistrePar: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
