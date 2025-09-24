// src/share/entities/share.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Unique(['user_id', 'reel_id'])
@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  share_id: string;

  @Column('uuid')
  reel_id: string;

  @Column('uuid')
  user_id: string;

  @CreateDateColumn()
  createdAt: Date;
}
