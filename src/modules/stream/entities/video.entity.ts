import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Audio } from './audio.entity';

export enum VideoType {
    NEWS = 'news',
    STORY = 'story',
    REELS = 'reels',
}

@Entity()
export class Video {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;
    
    @Column({type:'uuid' , nullable: false})
    user_id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    caption: string;

    @Column('simple-array')
    hashtags: string[];

    @Column()
    videoUrl: string;

    @ManyToOne(() => Audio, audio => audio.videos, { nullable: true })
    audio: Audio | null;

    @Column({
        type: 'enum',
        enum: VideoType,
    })
    type: VideoType;

    @Column({ type: 'varchar', nullable: true })
    audio_trim_from: string | null;

    @Column({ type: 'varchar', nullable: true })
    audio_trim_to: string | null;

    @CreateDateColumn()
    created_at: Date;

    @Column({ default: false })
    archived: boolean;
}

