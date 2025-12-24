import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ManagementRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  MODERATOR = "MODERATOR",
}


@Entity("management_users")
export class ManagementUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: "enum",
    enum: ManagementRole,
    default: ManagementRole.ADMIN,
  })
  role: ManagementRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default ManagementUser