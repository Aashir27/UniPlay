# UniPlay

UniPlay is a Next.js web application designed to facilitate university sports game discovery, scheduling, and participation. It connects students to games based on their skills and interests, allowing organizers to easily manage events.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database ORM:** [Prisma v7](https://www.prisma.io/)
- **Database:** PostgreSQL (Designed for AWS RDS)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials Provider / JWT)
- **Styling:** Tailwind CSS

## Project Architecture

This repository holds the foundation for a three-tier architecture:

- **Client Tier:** React components (in `app/`)
- **Service Layer:** Dedicated business logic services (`src/services/`) enforcing rules (e.g., concurrency control via Prisma transactions for joining games).
- **Data Tier:** PostgreSQL interacted strictly through the Prisma Client (`src/lib/prisma.ts`).

## Getting Started

Follow these steps to set up the project locally.

### 1. Install Dependencies

Install all Node.js dependencies (including Prisma and Postgres adapters):

```bash
npm install
```

### 2. Environment Variables

Create a local environment file.

```bash
cp .env.example .env
```

Open `.env` and configure your `DATABASE_URL` (pointing to a local or cloud PostgreSQL instance), `NEXTAUTH_SECRET` (generate a random string), and SMTP settings.

- For local email testing, Mailhog can listen on `SMTP_HOST=localhost` and `SMTP_PORT=1025`.
- For real registration emails, use a free SMTP relay such as **Brevo**.
  - Brevo SMTP host: `smtp-relay.brevo.com`
  - Brevo SMTP port: `587`
  - Use the SMTP key you generate in the Brevo dashboard
  - Set `SMTP_FROM` to a sender/domain you verified in Brevo

The verification OTP is sent by email during registration; the `/verify-email` page is only for entering the code the user received in their inbox.

### 3. Database Setup & Prisma

Once your database is running and connected via the `.env` file, push the schema to the database:

```bash
# Push schema without creating formal migration history (good for early prototyping)
npx prisma db push

# OR create an initial migration:
npx prisma migrate dev --name init
```

After the database schema is in sync, generate the strongly-typed Prisma Client:

```bash
# Format your schema (optional)
npx prisma format

# Validate schema structure
npx prisma validate

# Generate the client
npx prisma generate
```

### 4. Run the Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Basics (AWS)

This repository includes a multi-stage `Dockerfile` optimized for Next.js standalone output. It is structured for deployment to AWS (Elastic Container Service / App Runner) rather than Vercel.

A GitHub Actions workflow skeleton is available in `.github/workflows/deploy.yml` which validates the schema, runs Type checks/tests, and includes a commented-out deployment step to an Amazon ECR registry.

To test the production build locally:

```bash
npm run build
npm start
```
