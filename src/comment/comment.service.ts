import { ConflictException, Injectable, NotFoundException, Post } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentService {
  constructor(@InjectRepository(Comment) private readonly commentRepository : Repository<Comment>, ){}
  
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const commentEntity = this.commentRepository.create(createCommentDto);
    return await this.commentRepository.save(commentEntity);
  }

 async getComments(id: number) {
  return this.commentRepository.find({
    where: { id } ,
  });
}

  async delete(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  return await this.commentRepository.remove(comment);
  }
}
