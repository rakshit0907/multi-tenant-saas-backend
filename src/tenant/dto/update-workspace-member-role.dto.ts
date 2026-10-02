import { IsEnum } from 'class-validator';
import { WorkspaceRole } from '../workspace-member.entity';

export class UpdateWorkspaceMemberRoleDto {
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
