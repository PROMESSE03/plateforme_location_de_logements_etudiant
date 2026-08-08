import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.buildLoginResponse(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    return user;
  }

  async login(user: User) {
    return this.buildLoginResponse(user);
  }

  // Toujours répondre pareil, que l'email existe ou non — sinon on
  // révèle involontairement quels emails ont un compte (faille de
  // sécurité classique dite "user enumeration").
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await this.usersService.setResetToken(user.id, hashedToken, expires);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:3002';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await this.usersService.findByValidResetToken(hashedToken);
    if (!user) {
      throw new BadRequestException(
        'Ce lien de réinitialisation est invalide ou expiré. Demandes-en un nouveau.',
      );
    }

    await this.usersService.resetPassword(user.id, newPassword);
  }

  private buildLoginResponse(user: User) {
    const roles = user.roles.map((r) => r.role);
    const payload = { sub: user.id, email: user.email, roles };
    return {
      access_token: this.jwtService.sign(payload),
      user: this.usersService.toPublic(user),
    };
  }
}
