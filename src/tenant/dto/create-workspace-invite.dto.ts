import { WorkspaceRole } from '../workspace-member.entity';

export class CreateWorkspaceInviteDto {
  email!: string;
  role!: WorkspaceRole;
}
