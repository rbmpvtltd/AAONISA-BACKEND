import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../stream/entities/video.entity';

@Entity('bookmarks')
@Unique(['user', 'name'])
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.bookmarks, { onDelete: 'CASCADE' })
  user: User;

  @ManyToMany(() => Video, (reel) => reel.bookmarks, { cascade: true })
  @JoinTable({
    name: 'bookmark_reels',
    joinColumn: { name: 'bookmark_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'reel_id', referencedColumnName: 'id' },
  })
  reels: Video[];
}
