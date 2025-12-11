import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UpdateReportStatusDto } from "./dto/update-report.dto";
import { AdminActionDto } from "./dto/admin-action.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ReportService } from "./report.service";

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ---------------- USER ROUTES ----------------

  @Post()
  createReport(@Req() req, @Body() dto: CreateReportDto) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.reportService.createReport(userId, dto);
  }

  @Get('my')
  getMyReports(@Req() req, @Query('status') status?: string) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.reportService.getMyReports(userId, status);
  }

  // ---------------- ADMIN ROUTES ----------------

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  getAllReports(@Query() query: any) {
    return this.reportService.getAllReports(query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.reportService.updateStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/:id/action')
  takeAction(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AdminActionDto,
  ) {
    const payload = req.user;
    const userId = payload?.sub || payload?.id || payload?.userId;
    return this.reportService.takeAction(userId, id, dto);
  }
}
