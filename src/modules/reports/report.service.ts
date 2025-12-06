import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminAction, Report, ReportStatus } from "./entities/report.entity";
import { Video } from "../stream/entities/video.entity";
import { User } from "../users/entities/user.entity";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportStatusDto } from "./dto/update-report.dto";
import { AdminActionDto } from "./dto/admin-action.dto";

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,

    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ✅ USER → CREATE REPORT
  async createReport(userId: string, dto: CreateReportDto) {
    console.log(dto);
    const video = await this.videoRepo.findOne({
      where: { uuid: dto.videoId },
    });

    if (!video) throw new NotFoundException('Video not found');

    const alreadyReported = await this.reportRepo.findOne({
      where: {
        user: { id: userId },
        video: { uuid: dto.videoId },
      },
    });

    if (alreadyReported)
      throw new BadRequestException({
  message: 'You already reported this video',
  error: 'ALREADY_REPORTED',
});


    const user = await this.userRepo.findOne({ where: { id: userId } });
    if(!user) throw new NotFoundException('User not found');
    const report = this.reportRepo.create({
      user,
      video,
      description: dto.description,
    });

    return this.reportRepo.save(report);
  }

  // ✅ USER → GET MY REPORTS
  async getMyReports(userId: string, status?: string) {
    const where: any = { user: { id: userId } };

    if (status) where.status = status;

    return this.reportRepo.find({
      where,
      relations: ['video'],
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ ADMIN → GET ALL REPORTS
  async getAllReports(query: any) {
    return this.reportRepo.find({
      where: query,
      relations: ['user', 'video'],
      order: { createdAt: 'DESC' },
    });
  }

  // ✅ ADMIN → UPDATE STATUS
  async updateStatus(reportId: string, dto: UpdateReportStatusDto) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');

    report.status = dto.status;
    return this.reportRepo.save(report);
  }

  // ✅ ADMIN → TAKE ACTION
  async takeAction(adminId: string, reportId: string, dto: AdminActionDto) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
      relations: ['video', 'user'],
    });

    if (!report) throw new NotFoundException('Report not found');

    report.actionTaken = dto.action;
    report.adminRemarks = dto.adminRemarks;
    report.actionTakenAt = new Date();
    report.status = ReportStatus.RESOLVED;

    // ✅ VIDEO HARD DELETE
    if (dto.action === AdminAction.VIDEO_REMOVED) {
      await this.videoRepo.remove(report.video); 
      // ✅ reports auto delete via CASCADE
      return { message: 'Video deleted & report resolved' };
    }

    // ✅ USER SUSPEND / BAN
    // if (
    //   dto.action === AdminAction.USER_SUSPENDED ||
    //   dto.action === AdminAction.USER_BANNED
    // ) {
    //   report.user.isBlocked = true;
    //   await this.userRepo.save(report.user);
    // }

    return this.reportRepo.save(report);
  }
}
