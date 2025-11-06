import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { User } from './entities/user.entity';
import { BlockUserDto } from './dto/block.dto';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async blockUser(dto: BlockUserDto, currentUserId: string) {
    const blockedBy = await this.userRepository.findOneBy({ id: currentUserId });
    if (!blockedBy) throw new NotFoundException('User not found');

    const blockedUser = await this.userRepository.findOneBy({
      username: dto.username,
    });
    if (!blockedUser) throw new NotFoundException('User to block not found');

    if (blockedBy.id === blockedUser.id)
      throw new ConflictException('You cannot block yourself');

    const existingBlock = await this.blockRepository.findOne({
      where: { blockedBy: { id: blockedBy.id }, blockedUser: { id: blockedUser.id } },
    });
    if (existingBlock) throw new ConflictException('User already blocked');

    const block = this.blockRepository.create({ blockedBy, blockedUser });
    return this.blockRepository.save(block);
  }

  async unblockUser(dto: BlockUserDto, currentUserId: string) {
    const blockedUser = await this.userRepository.findOneBy({
      username: dto.username,
    });
    if (!blockedUser) throw new NotFoundException('User not found');

    const block = await this.blockRepository.findOne({
      where: {
        blockedBy: { id: currentUserId },
        blockedUser: { id: blockedUser.id },
      },
    });

    if (!block) throw new NotFoundException('Block relationship not found');

    return this.blockRepository.remove(block);
  }

  async getBlockedUsers(currentUserId: string) {
    const blocks = await this.blockRepository.find({
      where: { blockedBy: { id: currentUserId } },
      relations: ['blockedUser'],
      order: { createdAt: 'DESC' },
    });
    return blocks.map((b) => b.blockedUser);
  }
}
