import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports/user/:id → Report user
  @Post('user/:id')
  reportUser(@Param('id') userId: string, @Body() body: any) {
    return this.reportsService.reportUser(userId, body);
  }

  // POST /reports/post/:id → Report post
  @Post('post/:id')
  reportPost(@Param('id') postId: string, @Body() body: any) {
    return this.reportsService.reportPost(postId, body);
  }

  // POST /reports/reel/:id → Report reel
  @Post('reel/:id')
  reportReel(@Param('id') reelId: string, @Body() body: any) {
    return this.reportsService.reportReel(reelId, body);
  }

  // GET /reports (admin only)
  @Get()
//   @UseGuards(AuthGuard, RolesGuard)
//   @Roles('admin')  // sirf admin access
  getAllReports() {
    return this.reportsService.getAllReports();
  }
}
