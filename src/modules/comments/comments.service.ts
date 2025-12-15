// import { ConflictException, Injectable, NotFoundException, Post } from '@nestjs/common';
// import { CreateCommentDto } from './dto/create-comment.dto';
// import { UpdateCommentDto } from './dto/update-comment.dto';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Comment } from './entities/comment.entity';

// @Injectable()
// export class CommentService {
//   constructor(@InjectRepository(Comment) private readonly commentRepository : Repository<Comment>, ){}

//   async create(createCommentDto: CreateCommentDto): Promise<Comment> {
//     const commentEntity = this.commentRepository.create(createCommentDto);
//     return await this.commentRepository.save(commentEntity);
//   }

//  async getComments(id: number) {
//   return this.commentRepository.find({
//     where: { id } ,
//   });
// }

//   async delete(id: number) {
//     const comment = await this.commentRepository.findOne({
//       where: { id },
//     });
//   if (!comment) {
//     throw new Error('Comment not found');
//   }

//   return await this.commentRepository.remove(comment);
//   }
// }
import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Video } from 'src/modules/stream/entities/video.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AppGateway } from 'src/app.gateway';
import { TokenService } from '../tokens/token.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/entities/notification.entity';
@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Video)
        private readonly postRepository: Repository<Video>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly gateway: AppGateway,
        private readonly tokenService: TokenService,
        private readonly notificationService: NotificationService
    ) { }

    async create(dto: CreateCommentDto, userId: string) {
        // const post = await this.postRepository.findOneBy({ uuid: dto.postId });
        const post = await this.postRepository.findOne({
            where: { uuid: dto.postId },
            relations: {
                user_id: true,
            },
        });

        if (!post) throw new NotFoundException('Post not found');

        const author = await this.userRepository.findOneBy({ id: userId });
        if (!author) throw new NotFoundException('User not found');

        let parent: Comment | null = null;
        if (dto.parentId) {
            parent = await this.commentRepository.findOne({
                where: { id: dto.parentId },
                relations: ['parent'],
            });
            if (!parent) throw new NotFoundException('Parent comment not found');
        }

        let mentions: User[] = [];
        if (dto.mentions?.length) {
            mentions = await this.userRepository
                .createQueryBuilder('user')
                .where('user.username IN (:...usernames)', { usernames: dto.mentions })
                .getMany();

            if (mentions.length !== dto.mentions.length) {
                const foundUsernames = mentions.map(u => u.username);
                const missing = dto.mentions.filter(u => !foundUsernames.includes(u));
                console.warn(`⚠️ Some mentioned users not found: ${missing.join(', ')}`);
            }
        }
        try {
            // 🔔 Push notification
            this.tokenService.sendNotification(
                post.user_id.id,
                'Hithoy',
                `${author.username} commented on your post`,
            );

            this.notificationService.createNotification(
                post.user_id,
                author,
                NotificationType.COMMENT,
                `${author.username} commented on your post`,
                post.uuid,
            );
        } catch (err) {
            console.warn('Notification failed:', err.message);
        }

        const comment = this.commentRepository.create({
            content: dto.content,
            reel: post,
            author,
            parent,
            mentions,
        });

        for (const mention of mentions) {
            try {
                this.tokenService.sendNotification(
                    mention.id,
                    'Hithoy',
                    `${author.username} mentioned you in a comment`,
                );
                 this.notificationService.createNotification(
                    mention,        
                    author,                      
                    NotificationType.MENTION,       
                    `${author.username} mentioned you in a comment`,
                    post.uuid,           
                );
            } catch (err) {
                console.warn('Notification failed:', err.message);
            }
        }


        const saved = await this.commentRepository.save(comment);

        // ✅ Re-fetch full comment with author, reel, replies, etc.
        const populated = await this.commentRepository.findOne({
            where: { id: saved.id },
            relations: ['author', 'reel', 'replies', 'mentions', 'likedBy', 'parent'],
        });

        // ✅ Return plain JSON so frontend doesn’t crash
        return populated;
        ;
    }

    async findByPost(postId: string) {
        return this.commentRepository.find({
            where: { reel: { uuid: postId }, parent: IsNull() },
            relations: [
                'author',
                'replies',
                'likedBy',
                'replies.author',
                'replies.author.userProfile',
                'replies.likedBy',
                'mentions',
                'reel',
                'author.userProfile',
            ],
            order: { createdAt: 'ASC' },
        });
    }

    async findByReplies(commentId: string) {
        return this.commentRepository.find({
            where: { parent: { id: commentId } },
            relations: [
                'author',
                'replies',
                'replies.author',
                'mentions',
                'post',
            ],
            order: { createdAt: 'ASC' },
        });
    }

    async delete(commentId: string, userId: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['author'],
        });
        if (!comment) throw new NotFoundException('Comment not found');

        if (comment.author?.id !== userId) {
            throw new ForbiddenException('You cannot delete this comment');
        }

        return this.commentRepository.remove(comment);
    }

    async likeUnlike(commentId: string, userId: string) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['likedBy'],
        });

        if (!comment) throw new NotFoundException('Comment not found');

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) throw new NotFoundException('User not found');

        const alreadyLiked = comment.likedBy.some((u) => u.id === userId);

        if (alreadyLiked) {
            comment.likedBy = comment.likedBy.filter((u) => u.id !== userId);
        } else {
            comment.likedBy.push(user);
        }

        await this.commentRepository.save(comment);

        return {
            message: alreadyLiked ? 'Unliked successfully' : 'Liked successfully',
            liked: !alreadyLiked,
            likesCount: comment.likedBy.length,
        };
    }

}
