import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("management_otps")
export class ManagementOtp {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  @Column()
  phone: string;
  @Column()
  otp: string;

  @Column()
  purpose: "LOGIN" | "VERIFY" | "FORGOT_PASSWORD";

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
