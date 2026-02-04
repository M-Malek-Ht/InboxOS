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

class GithubCallbackGuard extends AuthGuard('github') {
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
    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 h
    });
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:8080');
  }

  // ── GitHub ──────────────────────────────────────────

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Passport redirects to GitHub; this body is never reached.
  }

  @Get('github/callback')
  @UseGuards(GithubCallbackGuard)
  async githubCallback(@Request() req: any, @Response() res: any) {
    const token = this.authService.generateToken(req.user);
    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'lax',
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
