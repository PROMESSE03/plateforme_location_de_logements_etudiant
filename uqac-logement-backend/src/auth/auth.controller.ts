import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

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
}
