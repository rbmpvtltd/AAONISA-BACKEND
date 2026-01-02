// // src/share/entities/share.entity.ts

// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   Unique,
// } from 'typeorm';

// @Unique(['user_id', 'reel_id'])
// @Entity('shares')
// export class Share {
//   @PrimaryGeneratedColumn('uuid')
//   share_id: string;

//   @Column('uuid')
//   reel_id: string;

//   @Column('uuid')
//   user_id: string;

//   @CreateDateColumn()
//   createdAt: Date;
// }

// src/share/entities/share.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  share_id: string;

  // kis reel ko share kiya
  @Column('uuid')
  reel_id: string;

  // kisne share kiya
  @Column('uuid')
  shared_by_user_id: string;

  // kisko share kiya
  @Column('uuid')
  shared_to_user_id: string;

  @CreateDateColumn()
  createdAt: Date;
}
