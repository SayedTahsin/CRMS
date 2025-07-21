# 🧑‍🏫 Academic Schedule & Analytics Platform – Built with React, Hono, tRPC, and Drizzle ORM

A full-stack academic scheduling and analytics platform with inline editable tables, permission-based access control, and role-aware tracking—powered by a modern TypeScript stack: React, TanStack Router, Hono, tRPC, and Drizzle ORM.

---

## 🌟 Overview

This project is a real-world, production-ready education management platform featuring:

- End-to-end typesafe communication via tRPC  
- Fine-grained permission control (PBAC)  
- Inline class history editing and creation
- Upload, view, and manage files (PDFs, images, etc.) with Supabase Storage
- Date- and role-based filters for tracking  
- Fully responsive, component-driven UI  
- Scheduled cron jobs for weekly analytics  
- Optimized developer experience with Bun, Biome, and modular structure

Ideal for schools, universities, or teams building robust, role-aware class scheduling and tracking tools.

---

## 💡 Tech Highlights

- 🔄 Typesafe data flow across frontend and backend using tRPC + TypeScript  
- 🧑‍🏫 Permission-Based Access Control (PBAC) – scoped actions by role  
- ✏️ Inline editing of schedule entries via double-click  
- 📅 Slot × Date Matrix – intuitive view of classes and gaps  
- 📊 Class history analytics – track per teacher, section, or room  
- 📨 Email verification & password reset via Resend  
- 🗂️ Resource Management – Upload, view, and delete files with secure Supabase Storage (S3 compatible)
- ⚡ Blazing-fast dev environment with Bun and SQLite  
- 🧩 Modular architecture – clean, scalable, and maintainable  

---

## 🔧 Tech Stack

### 🧱 Frontend

- **React** – Component-driven, declarative UI  
- **TypeScript** – Static typing across the stack  
- **TanStack Router** – Nested, type-safe routing  
- **TailwindCSS** – Utility-first CSS framework  
- **shadcn/ui** – Accessible components with Radix UI  
- **TanStack Query** – Data synchronization with caching  
- **Redux** – Global state management for auth/user state  

### 🛠 Backend & Infrastructure

- **Hono** – Ultra-light, edge-compatible backend framework  
- **tRPC** – Typesafe APIs without REST or GraphQL  
- **Drizzle ORM** – SQL-first, type-safe database access  
- **SQLite / Turso** – Lightweight, local and edge-friendly database  
- **Supabase Storage** – Secure, signed file uploads per user and course (S3 compatible)
- **Bun** – Fast JavaScript/TypeScript runtime with native TS support  

### 🔐 Authentication & Access Control

- **Better Auth** – Email/password login, passkey, verification, reset  
- **PBAC** – Permission-based access rules by role and ownership  
- **Resend** – SMTP email delivery for auth workflows  
- **Middleware-based Guarding** – Centralized route protection  
- **Role-Based UI Logic** – UI adjusts to SuperAdmin, Teacher, CR, etc.  

---

## 📊 Functionality

- 🔍 **Date-Range Filtering** – Select and filter class history over time  
- ✏️ **Inline Table Editing** – Create/edit class info directly in table view  
- 🧩 **Slot × Date Matrix** – Visually map classes in a clean grid  
- 🧠 **Teacher / Section / Room Analytics** – Filter data by overview  
- 🕐 **Weekly Cron Jobs** – Background processing with `Croner`  
- 🧼 **Zero-Runtime Type Errors** – Through TRPC + TypeScript contracts  
- 🗃️ **Resource Uploads** – Upload PDFs or images scoped to a course

---

## 🧪 Developer Experience

- **Biome** – Built-in linting, formatting, and TypeScript fixing  
- **Modular tRPC Routers** – Logical separation by feature/domain  
- **Shared Utilities and Hooks** – Reusable, composable logic across app  
- **Environment Config** – `.env` based per-app dev/prod setups  
- **TurboRepo** – Efficient monorepo task running for scalable project workflows  
- **Lint-Staged + Husky** – Git pre-commit hooks to auto-format staged files with Biome  

---

## ⚙️ Getting Started

### Install dependencies

```bash
bun install
```

### Database setup
This project uses SQLite (Turso) with Drizzle ORM.

1. Start the local SQLite database:

```bash
cd apps/server && bun db:local
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details. (see `.env.example` for reference).

3. Apply the schema to your database:

```bash
bun db:generate
bun db:push
```
4. Populate `role`, `role_permission` & `permission` tables with the JSON's inside `/apps/server/src/db/important-data` folder. 

5. Assign `SuperAdmin` role to the user you want to make SuperAdmin in `user_role` table. And update that user's roleId in `user` Table to `SuperAdmin`.

6. Read the API_PERMISSION Doc `/apps/server/src/routers/API_PERMISSION_REQUIREMENTS.md` for understanding the permissions.

### SMTP setup
Go to [resend.com](https://resend.com) and update SMTP credentials in your `.env` file (see `.env.example` for reference).

### Supabase setup
- Go to Supbase and create a new project.
- Create a new bucket in the storage tab. and name it `pdf`
- Go to Storage Setting and get S3 Connect URL, region, access-keys and upadate `.env` file (see `.env.example` for reference)

### Run the development server
Go to root directory and run: 
```bash
bun dev
```


Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

The API is running at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env` file in both **apps/server** and **apps/web** before starting the app. Follow `.env.example` files for both `/server` & `/web` folders.


> **Note:** If you specify `VITE_ALLOWED_HOSTS`, you need to explicitly load the `.env` file when running the development server:
>
> ```bash
> bun --env-file=apps/web/.env dev
> ```

### Generating a secure `BETTER_AUTH_SECRET`

Generate a cryptographically‑secure secret with **OpenSSL**:

```bash
openssl rand -base64 32
```

Copy the output and paste it into the `BETTER_AUTH_SECRET` entry in your backend `.env` file.

> **Tip:** Regenerate the secret when deploying to a different environment (staging, production, etc.) to isolate sessions across environments.


When deploying to a remote server, update the environment variables accordingly.

## 🧰 Monorepo Structure
This project uses **TurboRepo** to manage multiple apps in a monorepo:

```
react-tanstack-router-hono-drizzle/
├── apps/
│   ├── web/                   # Frontend application
│   │   ├── src/
│   │   │   ├── routers/       # TanStack Router config and routes
│   │   │   ├── store/         # Redux store for user state
│   │   │   ├── utils/         # Utility functions
│   │   │   ├── components/    # UI and app components
│   │   │   │   └── ui/        # shadcn/ui components
│   │   │   ├── lib/           # Client-side plugins (e.g., TRPC)
│   │   │   └── hooks/         # Reusable React hooks
│   └── server/                # Backend application
│       └── src/
│           ├── db/           # Drizzle schema, migrations
│           ├── lib/          # Plugins, helpers (auth, cron, email)
│           └── routers/      # Modular TRPC routers per domain
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/server && bun db:local`: Start the local SQLite database
- `bun check`: Run Biome formatting and linting
