import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.split(' ')[1];

    console.log('Raw JWT token:', token);
    console.log('Token validation info:', { err, user, info });

    if (err || !user) {
      throw err || new UnauthorizedException('You must be logged in to access this resource');
    }

    return user;
  }
}
