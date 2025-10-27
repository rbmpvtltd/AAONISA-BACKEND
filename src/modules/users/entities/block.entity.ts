import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['blockedBy', 'blockedUser'])
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  blockedBy: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  blockedUser: User;

  @CreateDateColumn()
  createdAt: Date;
}
