import { UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ManagementUser } from "../management/entities/management.entity";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { loginDto } from "./dto/management-auth.dto";
export class ManagementAuthService {
    constructor(
        @InjectRepository(ManagementUser)
        private managementRepo: Repository<ManagementUser>,
        private jwtService: JwtService
    ) {}

    async loginWithPassword(dto: loginDto) {
  const user = await this.managementRepo.findOne({
    where: { email: dto.email },
  });

  if (!user || !user.password)
    throw new UnauthorizedException("Invalid credentials");

  const match = await bcrypt.compare(dto.password, user.password);
  if (!match) throw new UnauthorizedException("Invalid credentials");

  return this.issueToken(user);
}

issueToken(user: ManagementUser) {
  const payload = {
    sub: user.id,
    role: user.role,
    type: "MANAGEMENT",
  };

  return {
    accessToken: this.jwtService.sign(payload),
  };
}

}

