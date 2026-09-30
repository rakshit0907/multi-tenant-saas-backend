import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../workspace-member.entity';

export class CreateWorkspaceInviteDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}