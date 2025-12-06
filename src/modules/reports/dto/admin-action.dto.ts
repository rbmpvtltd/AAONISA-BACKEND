import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdminAction } from '../entities/report.entity';

export class AdminActionDto {
  @IsEnum(AdminAction)
  action: AdminAction; 
  // warning | video_removed | user_suspended | user_banned

  @IsOptional()
  @IsString()
  adminRemarks?: string;
}
