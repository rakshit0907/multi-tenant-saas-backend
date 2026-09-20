import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { TaskPriority, TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  labelIds?: string[];

  @IsOptional()
  @IsUUID()
  milestoneId?: string | null;
}
