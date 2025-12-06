import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../stream/entities/video.entity';

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum AdminAction {
  NONE = 'none',
  WARNING = 'warning',
  VIDEO_REMOVED = 'video_removed',
  USER_SUSPENDED = 'user_suspended',
  USER_BANNED = 'user_banned',
}

@Entity('reports')
@Unique(['user', 'video']) // ✅ ONE USER CAN REPORT ONE VIDEO ONLY ONCE
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ REPORTER
  @ManyToOne(() => User, { nullable: false })
  user: User;

  // ✅ REPORTED VIDEO (CASCADE DELETE)
  @ManyToOne(() => Video, { nullable: false, onDelete: 'CASCADE' })
  video: Video;

  // ✅ REPORT TEXT
  @Column({ type: 'text' })
  description: string;

  // ✅ STATUS
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  // ✅ ADMIN ACTION
  @Column({
    type: 'enum',
    enum: AdminAction,
    default: AdminAction.NONE,
  })
  actionTaken: AdminAction;

  @Column({ type: 'text', nullable: true })
  adminRemarks?: string;

  @ManyToOne(() => User, { nullable: true })
  actionTakenByAdmin?: User;

  @Column({ type: 'timestamptz', nullable: true })
  actionTakenAt?: Date;

  // ✅ ANALYTICS
  @Column({ default: 1 })
  reportWeightScore: number;

  @Column({ default: false })
  isRepeatOffenderVideo: boolean;

  @Column({ default: 0 })
  totalReportsOnThisVideo: number;

  // ✅ USER SOFT DELETE FLAG (SIRF REPORT KE ANDAR)
  @Column({ default: false })
  isUserDeleted: boolean;

  // ✅ TIMESTAMPS
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
