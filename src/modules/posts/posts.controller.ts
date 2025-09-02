// import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
// import { PostsService } from './posts.service';
// import { CreatePostDto } from './dto/create-post.dto';
// import { UpdatePostDto } from './dto/update-post.dto';

// @Controller('posts')
// export class PostsController {
//   constructor(private readonly postsService: PostsService) { }

//   // Posts Module
//   // Create post
//   @Post()
//   create(@Body() createPostDto: CreatePostDto) {
//     return this.postsService.create(createPostDto);
//   }

//   //  Get single post
//   @Get('id')
//   getSinglePost(@Param(':id') id: number) {
//     return this.postsService.getSinglePost(id);
//   }

//   // Get feed (paginated)
//   @Get()
//   getFeedPaginated() {
//     return this.postsService.getFeedPaginated();
//   }

//   @Put(':id')
//   updatePost(@Param('id') id: number) {
//     return this.postsService.updatePost(id)
//   }

//   // Update partial fields
//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
//     return this.postsService.update(+id, updatePostDto);
//   }

//   // Delete post
//   @Delete(':id')
//   remove(@Param('id') id: number) {
//     return this.postsService.remove(id);
//   }

//   // Post Media
//   // Upload images for post
//   @Post(':id/images')
// UploadImageForPost(@Param('id') id : number){
//   return this.postsService.UploadImageForPost(id)
// }

// }
