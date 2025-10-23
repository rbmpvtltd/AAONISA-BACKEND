import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  ManyToMany,
  JoinTable
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Audio } from './audio.entity';
import { Like } from '../../likes/entities/like.entity';
import { View } from '../../views/entities/view.entity';
import { IsOptional } from 'class-validator';
import { Hashtag } from './hashtag.entity';

export enum VideoType {
  news = 'news',
  story = 'story',
  reels = 'reels',
}

@Entity()
export class Video {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => User, (user) => user.videos, { onDelete: 'CASCADE' })
  user_id: User;

  @Column()
  title: string;

  @Column({ nullable: true })
  caption: string;

  @Column()
  videoUrl: string;

  @Column({nullable: true})
  @IsOptional()
  externalAudioSrc: string;

  @ManyToOne(() => Audio, (audio) => audio.videos, { nullable: true })
  audio: Audio | null;

  @Column({
    type: 'enum',
    enum: VideoType,
  })
  type: VideoType;

  @Column({ type: 'varchar', nullable: true })
  audio_trim_from: string | null;

  @Column({ type: 'varchar', nullable: true })
  audio_trim_to: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  archived: boolean;

  // ---------------- RELATIONS -----------------
  @OneToMany(() => Like, (like) => like.reel, { cascade: true })
  likes: Like[];

  @OneToMany(() => View, (view) => view.reel, { cascade: true })
  views: View[];

  @ManyToMany(() => User, { cascade: false })
  @JoinTable()
  mentions: User[];

   @ManyToMany(() => Hashtag, (hashtag) => hashtag.videos, { cascade: true })
  @JoinTable()
  hashtags: Hashtag[];
}
