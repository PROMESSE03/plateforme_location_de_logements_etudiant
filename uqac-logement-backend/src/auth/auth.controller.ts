import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  // LoginDto sert uniquement à valider/documenter le corps attendu.
  // La validation réelle des identifiants passe par LocalStrategy.
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req, @Body() _dto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Message générique volontaire, voir le commentaire dans AuthService
    return {
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Mot de passe réinitialisé avec succès.' };
  }
}
