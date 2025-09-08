import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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
  
  // @Column({ unique: true })
  // userName: string;

  // @Column({ nullable: true })
  // email: string;

  // @Column({ unique: true }) 
  // mobileNumber: string;

  // @Column()
  // password: string;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @Column({type:'enum', enum:StarLevel, default: StarLevel.none })
  star: StarLevel;
}
