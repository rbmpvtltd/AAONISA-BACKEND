import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Video } from 'src/modules/stream/entities/video.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Video, (reel) => reel.comments, {
    onDelete: 'CASCADE',
  })
  reel: Video;

  // Who wrote the comment
  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  author: User;

  // Parent comment (if reply)
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Comment|null;

  // Replies to this comment
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  // Mentioned users
  @ManyToMany(() => User)
  @JoinTable({
    name: 'comment_mentions', // join table for comment ↔ mentions
    joinColumn: { name: 'commentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  mentions: User[];

  @CreateDateColumn()
  createdAt: Date;
}
