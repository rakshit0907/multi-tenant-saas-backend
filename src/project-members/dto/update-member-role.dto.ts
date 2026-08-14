import { IsEnum } from 'class-validator';
import { ProjectRole } from '../../common/enums/project-role.enum';

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}