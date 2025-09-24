import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!process.env.SECRET_KEY) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_KEY,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Original JWT token:', token);
    console.log('JWT payload (if valid):', payload);

    return { userId: payload.sub };
  }
}
