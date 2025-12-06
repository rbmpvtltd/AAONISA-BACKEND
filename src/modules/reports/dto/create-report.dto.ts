import { IsUUID, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  videoId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string; // ✅ mandatory
}
