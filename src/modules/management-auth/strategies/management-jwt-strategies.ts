import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class ManagementJwtStrategy extends PassportStrategy(
  Strategy,
  "management-jwt"
) {
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

  async validate(payload: any) {
    if (payload.type !== "MANAGEMENT") {
      throw new UnauthorizedException(ConfigService);
    }

    return {
      id: payload.sub,
      role: payload.role,
    };
  }
}
