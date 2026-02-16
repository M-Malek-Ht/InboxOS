import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateDraftDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsIn(['Professional', 'Friendly', 'Short', 'Firm', 'Apologetic'])
  tone?: string;

  @IsOptional()
  @IsIn(['Short', 'Medium', 'Detailed'])
  length?: string;

  @IsOptional()
  @IsString()
  instruction?: string;

  @IsOptional()
  @IsIn(['draft', 'sent'])
  status?: 'draft' | 'sent';

  // Email context for AI generation (needed for external emails from Gmail/Microsoft)
  @IsOptional()
  @IsString()
  emailFrom?: string;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailBody?: string;
}
