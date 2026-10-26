# Multi-Tenant SaaS Backend

> A NestJS + TypeScript REST API for a multi-tenant project management platform. Users belong to one or more workspaces (tenants), each with its own projects, tasks, members and activity feed, protected by JWT authentication and per-workspace roles.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)

**Frontend repo:** [multi-tenant-saas-frontend](https://github.com/rakshit0907/multi-tenant-saas-frontend)

---

## Overview

This backend serves many workspaces from a single deployment and a single database. Every request is tied to a workspace through the JWT, and a user's permissions depend on the role they hold **in that workspace**, so the same person can be an Owner in one workspace and a Guest in another.

## Features

- **Workspaces (tenants):** create and manage isolated workspaces
- **Authentication:** JWT via Passport, bcrypt password hashing
- **Two-level roles:** global (`USER`, `ADMIN`) and per-workspace (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`)
- **Projects and tasks:** projects with members and invitations, tasks with labels
- **Activity feed and notifications:** track what changed and notify the right people
- **Dashboard:** summary data for a workspace
- **Email:** transactional email through Resend
- **Database migrations:** versioned schema changes with TypeORM
- **Input validation:** DTOs validated with class-validator

## Architecture

### Tenant isolation: shared database, shared schema

All tenants live in one PostgreSQL database and one schema. Tenant-scoped records carry the tenant (workspace) identifier, and queries are scoped by it.

Membership is modelled explicitly through a `WorkspaceMember` entity that links a user to a workspace (`tenantId` + `userId`) and stores that user's role in the workspace.

### How a request finds its tenant

```
Client
  | Authorization: Bearer <JWT>   (payload: userId, tenantId)
  v
JWT strategy: verifies the token, then checks the user
              still has a membership in that workspace
  v
Controller -> Service -> TypeORM -> PostgreSQL (queries scoped by tenantId)
```

The tenant comes from the signed token rather than a client-supplied header, so a caller cannot simply claim another workspace. Because membership is re-checked on each request, removing someone from a workspace takes effect immediately instead of waiting for their token to expire.

### Roles

| Level | Roles | Stored in |
|---|---|---|
| Global | `USER`, `ADMIN` | User |
| Workspace | `OWNER`, `ADMIN`, `MEMBER`, `GUEST` | WorkspaceMember |

### Project structure

```
src/
  activity/        # activity feed
  auth/            # login, registration, JWT strategy, DTOs
  common/          # shared enums and middleware
  dashboard/       # workspace summary data
  email/           # Resend integration
  migrations/      # TypeORM migrations
  notifications/   # notification module
  project/         # projects
  project-invitations/  # inviting people to projects
  project-members/      # project membership
  tasks/           # tasks and labels
  tenant/          # workspaces (tenants) and workspace membership
  users/           # user accounts
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL (`pg`) |
| ORM | TypeORM 0.3 with migrations |
| Auth | Passport + JWT, bcrypt |
| Validation | class-validator, class-transformer |
| Request context | nestjs-cls |
| Email | Resend |
| Testing | Jest, Supertest |
| Code quality | ESLint, Prettier |

## Getting started

### Prerequisites

- Node.js 20 or later
- PostgreSQL running locally

### Setup

```bash
git clone https://github.com/rakshit0907/multi-tenant-saas-backend.git
cd multi-tenant-saas-backend
npm install
cp .env.example .env     # then fill in your values
npm run migration:run
npm run start:dev
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DB_HOST` | PostgreSQL host |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_DATABASE` | Database name |
| `JWT_SECRET` | Secret used to sign and verify tokens |
| `RESEND_API_KEY` | API key for sending email through Resend |
| `EMAIL_FROM` | Sender address for outgoing email |
| `FRONTEND_URL` | Frontend base URL (used in links and CORS) |
| `BACKEND_PUBLIC_URL` | Public base URL of this API |

## Available scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:cov` | Coverage report |
| `npm run migration:generate` | Generate a migration |
| `npm run migration:run` | Apply migrations |
| `npm run migration:revert` | Roll back the last migration |

## Design decisions and trade-offs

**Why a shared database and schema?**
It keeps migrations simple (one schema to change), makes cross-tenant analytics easy, and scales well when there are many small workspaces. The trade-off is that isolation is enforced by the application: every tenant-scoped query must filter by the tenant, and one missed filter can leak data.

**Why workspace roles in a separate `WorkspaceMember` table?**
Putting the role on the user would force one role everywhere. A join entity lets a user hold different roles in different workspaces, which matches how tools like Slack or Notion work.

**Why take the tenant from the JWT instead of a header?**
A header is trivially spoofable. A signed token plus a membership check on every request means the tenant cannot be claimed, only granted.

**Known limitations**
- Isolation depends on application-level scoping, not on the database engine.
- The `User` entity still carries a legacy `tenant` relation alongside `WorkspaceMember`.

## Roadmap

- [ ] Add PostgreSQL Row-Level Security as a second line of defence against cross-tenant leaks
- [ ] Add tests that explicitly try to read another workspace's data
- [ ] Remove the legacy `tenant` relation from `User`
- [ ] Add Swagger/OpenAPI documentation
- [ ] Add Docker and CI

## Author

**Rakshit Pandey**
[Portfolio](https://rakshit-portfolio-bay.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/rakshit-pandey-96b854309/) · [GitHub](https://github.com/rakshit0907)

## License

MIT