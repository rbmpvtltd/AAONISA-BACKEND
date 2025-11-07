import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('tokens')
export class TokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @ManyToOne(() => User, (user) => user.tokens, { nullable: true, onDelete: 'CASCADE' })
  user?: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
