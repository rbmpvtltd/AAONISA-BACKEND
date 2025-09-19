import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Video } from './video.entity';

@Entity()
export class Audio {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column()
  author: string;

  @OneToMany(() => Video, video => video.audio)
  videos: Video[];
}
