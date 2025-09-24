import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../stream/entities/video.entity';

@Unique(['user', 'reel'])
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  like_id: string;

  @ManyToOne(() => Video, (video) => video.likes, { onDelete: 'CASCADE' })
  reel: Video;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
