import { Entity, PrimaryGeneratedColumn, Column,Check } from 'typeorm';
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
@Entity('users')
@Check(`"email" IS NOT NULL OR "phone_no" IS NOT NULL`)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, type: 'varchar', nullable: true })
  phone_no: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  refreshToken: string | null;

  @Column({ type: 'text', nullable: true })
  resetToken: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  resetTokenExpiry: Date | null;
}

