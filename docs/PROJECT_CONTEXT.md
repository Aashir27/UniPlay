# UniPlay - System Architecture & Implementation Foundation
**Version:** 1.1 (Includes CI/CD & Task Breakdown)
**Reference Documents:** Software Requirements Specification (SRS) v1.0, Software Design Specification (SDS) v1.0

## 1. System Architecture
UniPlay utilizes a three-tier architecture, deployed in a serverless environment.
* **Client Tier:** Next.js React components, styled with Tailwind CSS. State managed via NextAuth.js (Session).
* **Server Tier:** Next.js API Routes (deployed as serverless functions on Vercel). Enforces business logic via dedicated service modules.
* **Data Tier:** Managed PostgreSQL database. **Strict Rule:** All database interaction MUST occur through Prisma ORM. No raw SQL queries to prevent injection vulnerabilities.
* **External Services:** Nodemailer (SMTP) for transactional emails. Vercel for hosting.

## 2. CI/CD Pipeline & DevOps Strategy
To ensure code quality and reliable deployments, the project will utilize GitHub Actions paired with Vercel.

### 2.1 Continuous Integration (GitHub Actions)
Create a `.github/workflows/ci.yml` to run on every PR to `main`:
1.  **Environment Setup:** Node.js environment caching.
2.  **Linting & Formatting:** Run `next lint` and Prettier checks.
3.  **Type Checking:** Run `tsc --noEmit` to ensure TypeScript compliance.
4.  **Prisma Validation:** Run `npx prisma validate` and `npx prisma generate` to catch schema errors.
5.  **Automated Testing:** Run unit/integration tests (e.g., Jest/Vitest) mocking the Prisma client.

### 2.2 Continuous Deployment (Vercel)
* **Preview Environments:** Vercel automatically deploys every PR to a unique Preview URL. 
    * *Architectural Note:* Ensure a separate preview database or mocked DB state is configured in Vercel Environment Variables so PRs do not mutate the production PostgreSQL database.
* **Production Deployment:** Merges to `main` trigger Vercel to build and deploy to the production domain.
    * *Build Step:* Vercel must run `npx prisma migrate deploy` before `next build` to ensure the DB schema is up-to-date.

## 3. Database Schema (Prisma Models)
The database must be normalized. Use UUIDs for all primary keys.

* **User:**
    * `userID` (String, UUID, @id)
    * `name` (String)
    * `email` (String, @unique) - Must validate against university domain whitelist.
    * `passwordHash` (String) - Hashed via bcrypt (min 10 rounds).
    * `isVerified` (Boolean, default: false)
    * `role` (Enum: `STUDENT`, `ORGANIZER`, `ADMIN`)
* **SportProfile:**
    * `profileID` (String, UUID, @id)
    * `userID` (String, UUID, @relation)
    * `sport` (String)
    * `skillLevel` (Enum: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
    * *Constraint:* Unique compound index on `[userID, sport]`.
* **Game:**
    * `gameID` (String, UUID, @id)
    * `creatorID` (String, UUID, @relation)
    * `sport` (String), `dateTime` (DateTime), `location` (String)
    * `skillLevel` (Enum)
    * `maxParticipants` (Int, > 0), `currentCount` (Int, default 0)
    * `status` (Enum: `DRAFT`, `OPEN`, `FULL`, `CANCELLED`, `COMPLETED`)
* **Participation:**
    * `participationID` (String, UUID, @id)
    * `userID` (String, UUID, @relation)
    * `gameID` (String, UUID, @relation)
    * `status` (Enum: `PENDING`, `APPROVED`, `CANCELLED`)
    * `joinedAt` (DateTime, default: now())
* **Notification:**
    * `notifID` (String, UUID, @id)
    * `recipientID` (String, UUID, @relation)
    * `type` (Enum: `JOIN_REQUEST`, `JOIN_CONFIRM`, `CANCELLATION`, `WITHDRAWAL`, `REMINDER`)
    * `message` (String), `isRead` (Boolean, default: false)
    * `relatedGameID` (String, UUID, nullable)
* **EmailVerification:**
    * `tokenID` (String, UUID, @id), `userID` (String, UUID), `token` (String), `expiresAt` (DateTime), `used` (Boolean).

## 4. Core Services & Business Logic Constraints

### 4.1 AuthService
* **Registration:** Block non-university emails. Generate 6-digit OTP, store hashed in `EmailVerification`, send via Nodemailer.
* **Login:** Issue JWT upon successful bcrypt comparison. Session stored client-side via NextAuth.

### 4.2 ParticipationService (CRITICAL CONCURRENCY HANDLING)
* **Race Conditions:** When a user clicks "Join", the system MUST use database-level row locking via a Prisma `$transaction`. 
* **Logic:**
    1. Lock the `Game` row.
    2. Check if `currentCount < maxParticipants`.
    3. If true, insert `Participation` record AND increment `currentCount`.
    4. If false, rollback and return `409 Conflict`.

### 4.3 NotificationService
* Must be non-blocking. Database inserts for in-app notifications must complete, but Nodemailer SMTP failures should be caught and logged without returning a 500 error to the user.

## 5. Phased Task Breakdown (Implementation Roadmap)

### Phase 1: Foundation (Auth & Database)
- [ ] Initialize Next.js project with Tailwind, TypeScript, and Prisma.
- [ ] Setup Vercel project and GitHub Actions CI workflow (lint, typecheck, prisma validate).
- [ ] Define full Prisma schema based on Section 3.
- [ ] Implement UI for Registration and Login.
- [ ] Implement `AuthService`: University email whitelist validation, bcrypt hashing.
- [ ] Implement Nodemailer integration for OTP delivery.
- [ ] Configure NextAuth.js for JWT session management.

### Phase 2: Core Features (Game & Profile Management)
- [ ] Create UI/API for `SportProfile` creation and editing.
- [ ] Create UI/API for Game Post Creation (Form validation required).
- [ ] Implement Game feed dashboard (Read operations).
- [ ] Implement `ParticipationService`: Join a game (Implement Prisma `$transaction` for concurrency).
- [ ] Implement Cancel Game / Cancel Participation logic.
- [ ] Setup background cron job (or Vercel Cron) to transition Game status to `COMPLETED` when `dateTime` passes.

### Phase 3: Engagement (Discovery & Notifications)
- [ ] Implement robust search and filtering UI/API for the Game Feed (by sport, skill level, date, location).
- [ ] Implement `NotificationService`: Create DB records for join requests, approvals, and cancellations.
- [ ] Build global notification bell UI with unread badge calculation.
- [ ] Implement middleware for Role-Based Access Control (RBAC) ensuring sensitive API routes are protected.
- [ ] Build basic Admin dashboard for content moderation (delete posts, ban users).

### Phase 4: Intelligence & Polish
- [ ] Implement `RecommendationEngine` service: Match games to users based on overlapping `SportProfile` records.
- [ ] Add query indexing to Prisma schema for performance (`sport`, `status`, `dateTime`, `creatorID`).
- [ ] Implement rate limiting on Auth routes.
- [ ] Final UI/UX polish (ensure full responsiveness > 1024px, loading states, human-readable error messages).Context: I am establishing the architectural base for UniPlay. The project is a Next.js (App Router) application using TypeScript and Prisma. Use the PROJECT_FOUNDATION.md and the Level-1 DFD (Processes 1.0–5.0) as the absolute source of truth for logic and data structures.

Task: Please generate the following foundational elements:

Prisma Schema (prisma/schema.prisma):

Use PostgreSQL as the provider.

Implement models for User, SportProfile, Game, Participation, and Notification (mapping to DFD stores D1–D4).

Strict Requirements: All primary keys must be UUIDs. Include all Enums from the SDS (Role, SkillLevel, GameStatus, SportCategory).

Ensure the Participation model correctly handles the many-to-many relationship between User and Game with an enum for status (PENDING, ACCEPTED, REJECTED).

Service Layer (/src/services):
Create TypeScript skeletons (interfaces and empty functions) for the following based on the Level-1 DFD processes:

auth.service.ts (Process 1.0: Register, Login, Verify Email).

profile.service.ts (Process 2.0: Update Skill Levels, Manage Interests).

game.service.ts (Process 3.0: Create, Filter, and Update Games).

participation.service.ts (Process 4.0: Must include a Prisma atomic transaction for joining games to ensure player limits aren't exceeded).

notification.service.ts (Process 5.0: Triggering alerts).

Library Setup (/src/lib):

prisma.ts: A singleton Prisma Client instance.

auth.ts: A base NextAuth.js configuration skeleton (using Credentials provider).

Infrastructure & Environment:

.env.example: Placeholders for DATABASE_URL, NEXTAUTH_SECRET, and SMTP credentials.

.github/workflows/ci.yml: A CI pipeline that runs npm install, npx prisma validate, and npm run lint on every PR to main.

Strict Rules:

No UI implementation yet. Focus entirely on the architectural skeleton and type definitions.

Use TypeScript strictly (no any).

Follow the naming conventions defined in the PROJECT_FOUNDATION document.Context: I am establishing the architectural base for UniPlay. The project is a Next.js (App Router) application using TypeScript and Prisma. Use the PROJECT_FOUNDATION.md and the Level-1 DFD (Processes 1.0–5.0) as the absolute source of truth for logic and data structures.

Task: Please generate the following foundational elements:

Prisma Schema (prisma/schema.prisma):

Use PostgreSQL as the provider.

Implement models for User, SportProfile, Game, Participation, and Notification (mapping to DFD stores D1–D4).

Strict Requirements: All primary keys must be UUIDs. Include all Enums from the SDS (Role, SkillLevel, GameStatus, SportCategory).

Ensure the Participation model correctly handles the many-to-many relationship between User and Game with an enum for status (PENDING, ACCEPTED, REJECTED).

Service Layer (/src/services):
Create TypeScript skeletons (interfaces and empty functions) for the following based on the Level-1 DFD processes:

auth.service.ts (Process 1.0: Register, Login, Verify Email).

profile.service.ts (Process 2.0: Update Skill Levels, Manage Interests).

game.service.ts (Process 3.0: Create, Filter, and Update Games).

participation.service.ts (Process 4.0: Must include a Prisma atomic transaction for joining games to ensure player limits aren't exceeded).

notification.service.ts (Process 5.0: Triggering alerts).

Library Setup (/src/lib):

prisma.ts: A singleton Prisma Client instance.

auth.ts: A base NextAuth.js configuration skeleton (using Credentials provider).

Infrastructure & Environment:

.env.example: Placeholders for DATABASE_URL, NEXTAUTH_SECRET, and SMTP credentials.

.github/workflows/ci.yml: A CI pipeline that runs npm install, npx prisma validate, and npm run lint on every PR to main.

Strict Rules:

No UI implementation yet. Focus entirely on the architectural skeleton and type definitions.

Use TypeScript strictly (no any).

Follow the naming conventions defined in the PROJECT_FOUNDATION document.