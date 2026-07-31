import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { RoleType } from '../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  // Un nouvel utilisateur reçoit ROLE_TENANT par défaut.
  // Le passage à ROLE_OWNER se fait via une action explicite plus tard
  // (ex: "publier une annonce" ajoute le rôle si absent).
  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      nom: dto.nom,
    });
    const savedUser = await this.usersRepo.save(user);

    const defaultRole = this.userRolesRepo.create({
      user: savedUser,
      role: RoleType.TENANT,
    });
    await this.userRolesRepo.save(defaultRole);

    return this.findByIdOrFail(savedUser.id);
  }

  async addRole(userId: string, role: RoleType): Promise<User> {
    const user = await this.findByIdOrFail(userId);
    const alreadyHasRole = user.roles.some((r) => r.role === role);
    if (!alreadyHasRole) {
      const newRole = this.userRolesRepo.create({ user, role });
      await this.userRolesRepo.save(newRole);
    }
    return this.findByIdOrFail(userId);
  }

  // Ne jamais renvoyer passwordHash dans les réponses API
  toPublic(user: User) {
    const { passwordHash, ...publicUser } = user;
    return {
      ...publicUser,
      roles: user.roles.map((r) => r.role),
    };
  }
}
