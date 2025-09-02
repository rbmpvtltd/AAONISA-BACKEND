import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.accessToken
      ]),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY',
    });
  }
  async validate(payload: any) {
    // jo payload sign ke waqt dala tha wahi milega
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
