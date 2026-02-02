import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

export class CreateDraftDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsIn(['draft', 'sent'])
  status?: 'draft' | 'sent';
}
