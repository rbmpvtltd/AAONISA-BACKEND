import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Chat } from './chat.entity';

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn()
  session_id: number; // INT auto increment

  // Participant 1
  @ManyToOne(() => User, (user) => user.chatSessions1, { eager: false })
  user1: User;

  // Participant 2
  @ManyToOne(() => User, (user) => user.chatSessions2, { eager: false })
  user2: User;

  @CreateDateColumn()
  created_at: Date;

  // Messages inside this session
  @OneToMany(() => Chat, (chat) => chat.session)
  messages: Chat[];
}
