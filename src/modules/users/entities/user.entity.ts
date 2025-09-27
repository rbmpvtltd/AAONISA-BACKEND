import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Check,
  ManyToMany
} from 'typeorm';
import { Follow } from '../../follows/entities/follow.entity';
import { Like } from '../../likes/entities/like.entity';
import { View } from '../../views/entities/view.entity';
import { Video } from '../../stream/entities/video.entity';
import { Notification } from '../../notifications/entities/notification.entity';

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
}
