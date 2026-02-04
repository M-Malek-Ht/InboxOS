import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: `${configService.get<string>('APP_URL')}/auth/google/callback`,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.modify', // Allows read + mark as read
      ],
      // accessType is valid at runtime but missing from the type definitions
      accessType: 'offline',
      prompt: 'consent', // Force consent screen to always get refresh_token
    } as any);
  }

  // Override to ensure access_type and prompt are always sent to Google
  authorizationParams(): Record<string, string> {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    _accessToken: string,
    refreshToken: string | undefined,
    profile: { id: string; emails: { value: string }[] },
    done: VerifyCallback,
  ) {
    console.log('[GoogleStrategy] validate called, refreshToken:', refreshToken ? 'YES' : 'NO');
    const user = await this.authService.validateOrCreateOAuthUser(
      profile.emails[0].value,
      'google',
      profile.id,
      refreshToken,
    );
    done(null, user);
  }
}
