import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('APP_URL')}/auth/microsoft/callback`,
      scope: [
        'user.read',
        'openid',
        'email',
        'profile',
        'Mail.Read',
        'Mail.ReadWrite',
        'offline_access',
      ],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: {
      id: string;
      displayName?: string;
      emails?: { value: string; type?: string }[];
      _json?: { mail?: string; userPrincipalName?: string };
    },
    done: (err: Error | null, user?: unknown) => void,
  ) {
    let email = profile.emails?.[0]?.value;

    if (!email && profile._json) {
      email = profile._json.mail || profile._json.userPrincipalName;
    }

    if (!email) {
      return done(
        new Error('Could not retrieve email from Microsoft account'),
      );
    }

    const user = await this.authService.validateOrCreateOAuthUser(
      email,
      'microsoft',
      profile.id,
      refreshToken,
    );
    done(null, user);
  }
}
