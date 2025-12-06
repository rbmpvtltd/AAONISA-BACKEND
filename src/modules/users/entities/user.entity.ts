import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Check,
  ManyToMany,
  OneToOne
} from 'typeorm';
import { Follow } from '../../follows/entities/follow.entity';
import { Like } from '../../likes/entities/like.entity';
import { View } from '../../views/entities/view.entity';
import { Video } from '../../stream/entities/video.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Bookmark } from 'src/modules/bookmark/entities/bookmark.entity';
import { UserProfile } from './user-profile.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { TokenEntity } from 'src/modules/tokens/entities/token.entity';
import { is } from 'drizzle-orm';
import { IsOptional } from 'class-validator';
import { ChatSession } from 'src/modules/chat/entities/chat-session.entity';
import { Chat } from 'src/modules/chat/entities/chat.entity';
import { Report } from 'src/modules/reports/entities/report.entity';
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

  // ----------------- RELATIONS -----------------

  @OneToOne(() => UserProfile, profile => profile.user)
  userProfile: UserProfile;  // ✅ correct property name


  @OneToMany(() => Follow, (follow) => follow.follower, { cascade: true })
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following, { cascade: true })
  followers: Follow[];

  @OneToMany(() => Like, (like) => like.user, { cascade: true })
  likes: Like[];

  @OneToMany(() => View, (view) => view.user, { cascade: true })
  views: View[];

  @OneToMany(() => Video, (video) => video.user_id, { cascade: true })
  videos: Video[];

  @ManyToMany(() => Video, (video) => video.mentions)
  mentionedIn: Video[];

  @OneToMany(() => Notification, (notification) => notification.sender)
  notificationsSent: Notification[];

  // jo user ko mili
  @OneToMany(() => Notification, (notification) => notification.recipient)
  notificationsReceived: Notification[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @IsOptional()
  @OneToMany(() => TokenEntity, (token) => token.user)
  tokens?: TokenEntity[];

  @OneToMany(() => ChatSession, (session) => session.user1)
  chatSessions1: ChatSession[];

  @OneToMany(() => ChatSession, (session) => session.user2)
  chatSessions2: ChatSession[];

  @OneToMany(() => Chat, (chat) => chat.sender)
  messagesSent: Chat[];

  @OneToMany(() => Report, (report) => report.user)
reports: Report[];

}
