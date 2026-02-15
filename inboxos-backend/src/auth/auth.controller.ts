import {
  Controller,
  Get,
  UseGuards,
  Request,
  Response,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

class GoogleCallbackGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return { failureRedirect: '/auth/failed' };
  }
}

class MicrosoftCallbackGuard extends AuthGuard('microsoft') {
  getAuthenticateOptions() {
    return { failureRedirect: '/auth/failed' };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── Google ──────────────────────────────────────────

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport redirects to Google; this body is never reached.
  }

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(@Request() req: any, @Response() res: any) {
    const token = this.authService.generateToken(req.user);
   const isProd = process.env.NODE_ENV === 'production';

res.cookie('accessToken', token, {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,          // required when sameSite = 'none'
  path: '/',
  maxAge: 60 * 60 * 1000,
});

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
  }

  // ── Microsoft ─────────────────────────────────────────

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Passport redirects to Microsoft; this body is never reached.
  }

  @Get('microsoft/callback')
  @UseGuards(MicrosoftCallbackGuard)
  async microsoftCallback(@Request() req: any, @Response() res: any) {
    const token = this.authService.generateToken(req.user);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 1000,
  });

    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
  }

  // ── Shared ──────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('logout')
  async logout(@Response() res: any) {
    res.clearCookie('accessToken');
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
  }

  @Get('failed')
  async failed() {
    throw new HttpException(
      'Authentication failed',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
