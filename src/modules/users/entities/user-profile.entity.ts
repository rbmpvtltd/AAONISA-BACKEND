import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
export enum StarLevel {
  'none' = 0,
  'bronze' = 1,
  'silver' = 2,
  'gold' = 3
}

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @Column({default : '',nullable: true})
  ProfilePicture : string;

  @Column({default : '',nullable: true})
  bio : string;

  @Column({default : '',nullable: true})
  name : string;
  @Column({default : '',nullable: true})
  url : string;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @Column({type:'enum', enum:StarLevel, default: StarLevel.none })
  star: StarLevel;

  @OneToOne(() => User, user => user.userProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
