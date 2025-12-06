import { IsEnum } from 'class-validator';
import { ReportStatus } from '../entities/report.entity';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus; 
  // only: under_review | resolved | rejected
}
