import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${configService.get<string>('APP_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string | undefined,
    profile: { id: string; emails?: { value: string }[] },
    done: (err: Error | null, user?: unknown) => void,
  ) {
    let email = profile.emails?.[0]?.value;

    // GitHub only includes email in profile if it's public;
    // fetch from API using the access token if missing.
    if (!email) {
      const res = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails: { email: string; primary: boolean; verified: boolean }[] =
        await res.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email;
    }

    if (!email) {
      return done(
        new Error('Could not retrieve a verified email from GitHub'),
      );
    }

    const user = await this.authService.validateOrCreateOAuthUser(
      email,
      'github',
      profile.id,
    );
    done(null, user);
  }
}
