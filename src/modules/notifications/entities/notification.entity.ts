import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    LIKE = 'LIKE',
    COMMENT = 'COMMENT',
    FOLLOW = 'FOLLOW',
    MENTION = 'MENTION',
    MESSAGE = 'MESSAGE',
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.notificationsReceived, { eager: true })
    recipient: User;
    @ManyToOne(() => User, (user) => user.notificationsSent, { eager: true, nullable: true })
    sender?: User;
    // Notification type
    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    // Notification ka message / description
    @Column({ type: 'text', nullable: true })
    message: string;

    // Related entity id (like postId, commentId, etc)
    @Column({ type: 'uuid', nullable: true })
    referenceId: string;

    // Kya notification read ho chuki hai
    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
