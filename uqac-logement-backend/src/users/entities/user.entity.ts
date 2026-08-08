import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  // @Exclude() garantit que ce champ n'est JAMAIS sérialisé dans une réponse
  // JSON, même si l'entité User est chargée indirectement (ex: Listing.owner)
  // et qu'on oublie de passer par UsersService.toPublic().
  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  nom: string;

  @Column({ name: 'langue_pref', default: 'fr' })
  languePref: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user, { eager: true })
  roles: UserRole[];

  // Champs pour "mot de passe oublié" — jamais exposés dans les réponses API
  @Exclude()
  @Column({ name: 'reset_password_token', type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Exclude()
  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
