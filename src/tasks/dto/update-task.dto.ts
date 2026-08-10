import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { TaskPriority, TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}