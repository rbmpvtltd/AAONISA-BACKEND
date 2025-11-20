import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  chat_id: number; // BIGINT auto increment

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  session: ChatSession;

  @ManyToOne(() => User, (user) => user.messagesSent, { eager: false })
  sender: User;

  @Column({ type: 'text' })
  message_text: string;

  @CreateDateColumn()
  created_at: Date;
}
