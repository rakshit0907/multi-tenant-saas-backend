import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptExistingInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}