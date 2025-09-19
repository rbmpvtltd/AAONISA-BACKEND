// src/like/entities/like.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Unique(['user_id', 'reel_id'])
@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn('uuid')
  like_id: string;

  @Column('uuid')
  reel_id: string;

  @Column('uuid')
  user_id: string;

  @CreateDateColumn()
  createdAt: Date;
}
