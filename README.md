# UniPlay

UniPlay is a Next.js web application designed to facilitate university sports game discovery, scheduling, and participation. It connects students to games based on their skills and interests, allowing organizers to easily manage events.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database ORM:** [Prisma v7](https://www.prisma.io/)
- **Database:** PostgreSQL (Supabase or AWS RDS)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider / JWT)
- **Styling:** Tailwind CSS

## Project Architecture

This repository holds the foundation for a three-tier architecture:

- **Client Tier:** React components (in `app/`)
- **Service Layer:** Dedicated business logic services (`src/services/`) enforcing rules (e.g., concurrency control via Prisma transactions for joining games).
- **Data Tier:** PostgreSQL interacted strictly through the Prisma Client (`src/lib/prisma.ts`).


