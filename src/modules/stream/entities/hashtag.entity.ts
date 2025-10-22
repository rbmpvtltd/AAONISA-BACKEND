import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity()
export class Hashtag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tag: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToMany(() => Video, (video) => video.hashtags)
  videos: Video[];
}
