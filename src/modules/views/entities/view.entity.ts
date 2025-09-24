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
@Entity('views')
export class View {
  @PrimaryGeneratedColumn('uuid')
  view_id: string;

  @ManyToOne(() => User, (user) => user.views, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Video, (video) => video.views, { onDelete: 'CASCADE' })
  reel: Video;

  @CreateDateColumn()
  createdAt: Date;
}
