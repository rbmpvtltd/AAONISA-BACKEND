import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /search/users?q= → Search users
  @Get('users')
  searchUsers(@Query('q') query: string) {
    return this.searchService.searchUsers(query);
  }

  // GET /search/posts?q=  → Search posts
  @Get('posts')
  searchPosts(@Query('q') query: string) {
    return this.searchService.searchPosts(query);
  }

  // GET /search/reels?q=  → Search reels
  @Get('reels')
  searchReels(@Query('q') query: string) {
    return this.searchService.searchReels(query);
  }

  // GET /search/hashtags?q=  → Search by hashtags
  @Get('hashtags')
  searchHashtags(@Query('q') query: string) {
    return this.searchService.searchHashtags(query);
  }
}
