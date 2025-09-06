import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }


  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: `${id}` } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  getUserProfile (id: number) {
    console.log(id)
  }

  listAllUsers () {
    console.log("list all users logic")
  }

  deleteUser (id: number) {
    console.log(`delte user here with id ${id}`)
  }

  uploadChangeAvatar (avatar : number) {
    console.log(`upload change avatar here with avatar ${avatar}`)
  }

  followUser (id : number) {
    console.log(`follow user here with id ${id}`)
  }

  unfollowUser (id: number) {
    console.log(`unfollow user here with id ${id}`)
  }

  getFollowers (id:number) {
    console.log(`get followers here with id ${id}`)
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }
}
