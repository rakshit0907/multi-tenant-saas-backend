import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1789051135687 implements MigrationInterface {
    name = 'InitialSchema1789051135687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."project_member_role_enum" AS ENUM('OWNER', 'MEMBER')`);
        await queryRunner.query(`CREATE TABLE "project_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."project_member_role_enum" NOT NULL DEFAULT 'MEMBER', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "projectId" uuid, CONSTRAINT "PK_64dba8e9dcf96ce383cfd19d6fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "labels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying NOT NULL DEFAULT '#6B7280', "projectId" uuid, CONSTRAINT "PK_c0c4e97f76f1f3a268c7a70b925" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."task_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`);
        await queryRunner.query(`CREATE TYPE "public"."task_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "completed" boolean NOT NULL DEFAULT false, "priority" "public"."task_priority_enum" NOT NULL DEFAULT 'MEDIUM', "status" "public"."task_status_enum" NOT NULL DEFAULT 'PENDING', "dueDate" TIMESTAMP, "description" text, "projectId" uuid, "assigneeId" uuid, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organization_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "token" character varying NOT NULL, "accepted" boolean NOT NULL DEFAULT false, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "tenantId" uuid, CONSTRAINT "UQ_cfc7732a24fca0dbae9fce0c062" UNIQUE ("token"), CONSTRAINT "PK_b36f8c9832b1a4b21118585f8b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tenant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying, "emailVerificationExpiresAt" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "tenantId" uuid, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_comment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "taskId" uuid NOT NULL, "authorId" uuid NOT NULL, CONSTRAINT "PK_28da4411b195bfc3c451cfa21ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."project_invitation_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "project_invitation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."project_invitation_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid NOT NULL, "invitedUserId" uuid NOT NULL, "invitedById" uuid NOT NULL, CONSTRAINT "PK_ba41c49adf5e2c6e828de7a108d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "fileName" character varying NOT NULL, "filePath" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "taskId" uuid, "uploadedById" uuid, CONSTRAINT "PK_34eb9e5133310a488eaba0be28a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('PROJECT_INVITATION', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_STATUS_CHANGED', 'MEMBER_ADDED', 'MEMBER_REMOVED')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notification_type_enum" NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "projectId" uuid, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."activity_action_enum" AS ENUM('PROJECT_CREATED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_DELETED', 'TASK_STATUS_CHANGED', 'TASK_PRIORITY_CHANGED')`);
        await queryRunner.query(`CREATE TABLE "activity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."activity_action_enum" NOT NULL, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "projectId" uuid NOT NULL, "userId" uuid NOT NULL, "taskId" uuid, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_labels" ("taskId" uuid NOT NULL, "labelsId" uuid NOT NULL, CONSTRAINT "PK_05390d404a61de74465b50887c7" PRIMARY KEY ("taskId", "labelsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b148c8d5eb7df0b134cab11ad2" ON "task_labels" ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_64f274b789e6b3464466d2d835" ON "task_labels" ("labelsId") `);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_e7520163dafa7c1104fd672caad" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_member" ADD CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "labels" ADD CONSTRAINT "FK_4d6d0f5321d13f4f3e9f41a2846" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_7384988f7eeb777e44802a0baca" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_710135bfa3254e493e6ebe683d0" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_invite" ADD CONSTRAINT "FK_5b28ff514e053ee66a332b28c22" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_685bf353c85f23b6f848e4dcded" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_comment" ADD CONSTRAINT "FK_0fed042ede2365de8b32e105cc6" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_comment" ADD CONSTRAINT "FK_e0e20a1abae5cee7a04a578e0d6" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitation" ADD CONSTRAINT "FK_47d54879b49f70a1a22fefde3af" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitation" ADD CONSTRAINT "FK_85eb90bfa901f9e4a6cb7d1b122" FOREIGN KEY ("invitedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "project_invitation" ADD CONSTRAINT "FK_089ae8267b4c599f0eae1d255e2" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_attachments" ADD CONSTRAINT "FK_47d3c46e4edb30cdaf97ccdb8d8" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_attachments" ADD CONSTRAINT "FK_0989debb6be76703e78780d4f56" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_28a43a0b8c114e48b5bb002dc22" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_5a898f44fa31ef7916f0c38b016" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_2743f8990fde12f9586287eb09f" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_labels" ADD CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "task_labels" ADD CONSTRAINT "FK_64f274b789e6b3464466d2d8350" FOREIGN KEY ("labelsId") REFERENCES "labels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_labels" DROP CONSTRAINT "FK_64f274b789e6b3464466d2d8350"`);
        await queryRunner.query(`ALTER TABLE "task_labels" DROP CONSTRAINT "FK_b148c8d5eb7df0b134cab11ad2e"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_2743f8990fde12f9586287eb09f"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_3571467bcbe021f66e2bdce96ea"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_5a898f44fa31ef7916f0c38b016"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_28a43a0b8c114e48b5bb002dc22"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "task_attachments" DROP CONSTRAINT "FK_0989debb6be76703e78780d4f56"`);
        await queryRunner.query(`ALTER TABLE "task_attachments" DROP CONSTRAINT "FK_47d3c46e4edb30cdaf97ccdb8d8"`);
        await queryRunner.query(`ALTER TABLE "project_invitation" DROP CONSTRAINT "FK_089ae8267b4c599f0eae1d255e2"`);
        await queryRunner.query(`ALTER TABLE "project_invitation" DROP CONSTRAINT "FK_85eb90bfa901f9e4a6cb7d1b122"`);
        await queryRunner.query(`ALTER TABLE "project_invitation" DROP CONSTRAINT "FK_47d54879b49f70a1a22fefde3af"`);
        await queryRunner.query(`ALTER TABLE "task_comment" DROP CONSTRAINT "FK_e0e20a1abae5cee7a04a578e0d6"`);
        await queryRunner.query(`ALTER TABLE "task_comment" DROP CONSTRAINT "FK_0fed042ede2365de8b32e105cc6"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_685bf353c85f23b6f848e4dcded"`);
        await queryRunner.query(`ALTER TABLE "organization_invite" DROP CONSTRAINT "FK_5b28ff514e053ee66a332b28c22"`);
        await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_710135bfa3254e493e6ebe683d0"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_7384988f7eeb777e44802a0baca"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_3797a20ef5553ae87af126bc2fe"`);
        await queryRunner.query(`ALTER TABLE "labels" DROP CONSTRAINT "FK_4d6d0f5321d13f4f3e9f41a2846"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_7115f82a61e31ac95b2681d83e4"`);
        await queryRunner.query(`ALTER TABLE "project_member" DROP CONSTRAINT "FK_e7520163dafa7c1104fd672caad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64f274b789e6b3464466d2d835"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b148c8d5eb7df0b134cab11ad2"`);
        await queryRunner.query(`DROP TABLE "task_labels"`);
        await queryRunner.query(`DROP TABLE "activity"`);
        await queryRunner.query(`DROP TYPE "public"."activity_action_enum"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "task_attachments"`);
        await queryRunner.query(`DROP TABLE "project_invitation"`);
        await queryRunner.query(`DROP TYPE "public"."project_invitation_status_enum"`);
        await queryRunner.query(`DROP TABLE "task_comment"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "tenant"`);
        await queryRunner.query(`DROP TABLE "organization_invite"`);
        await queryRunner.query(`DROP TABLE "project"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."task_priority_enum"`);
        await queryRunner.query(`DROP TABLE "labels"`);
        await queryRunner.query(`DROP TABLE "project_member"`);
        await queryRunner.query(`DROP TYPE "public"."project_member_role_enum"`);
    }

}
