// src/view/entities/view.entity.ts

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
@Entity('views')
export class View {
  @PrimaryGeneratedColumn('uuid')
  view_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  reel_id: string;

 
  @CreateDateColumn()
  createdAt: Date;
}
