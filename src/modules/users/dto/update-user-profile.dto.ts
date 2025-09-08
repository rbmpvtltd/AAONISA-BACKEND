import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user-profile.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}