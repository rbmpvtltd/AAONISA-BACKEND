import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userName: string;

  @Column({ nullable: true }) // unique
  email: string;

  @Column({ unique: true })
  mobileNumber: string;

  @Column()
  password: string;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  @Column({ type: 'varchar', default: 'user' })
  role: string;

  @Column({ default: 'none' })
  star: string;
}
