import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Unique(['follower', 'following'])
@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  follow_id: string;

  @Column('uuid')
  follower: string;

  @Column('uuid')
  following: string;

  @CreateDateColumn()
  createdAt: Date;
}
