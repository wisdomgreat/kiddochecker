# Project Structure

This document details the file and folder layout of the KiddoChecker repository.

## Directory Tree

```text
kiddochecker/
├── .planning/                  # GSD planning and roadmap docs (Current)
├── server/                     # Backend Express server (Bridge API)
│   ├── index.js                # Server entry point & SQL handlers
│   ├── package.json            # Backend dependencies
│   └── azure_ready_data.sql    # Database schema & seed data
├── src/                        # React SPA source code
│   ├── components/             # Reusable UI components
│   │   ├── kiosk/              # Kiosk-specific subsystems
│   │   │   └── KioskCheckInSystem.tsx
│   │   ├── layout/             # Sidebar and layout systems
│   │   └── ui/                 # Shadcn primitives
│   ├── hooks/                  # Custom React hooks (toast, etc.)
│   ├── integrations/           # Supabase / API clients
│   ├── lib/                    # Library utils (cn)
│   ├── pages/                  # Main SPA routing pages
│   │   └── EnhancedReportsPage.tsx
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Core App routing & providers
│   ├── main.tsx                # SPA entry point
│   └── index.css               # Global tailwind styling
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configurations
└── tsconfig.json               # TypeScript configurations
```

## Key Files & Roles

*   `server/index.js`: Manages RPC queries, schema bootstrapping on startup, PostgreSQL connection pooling, and security middleware.
*   `src/components/kiosk/KioskCheckInSystem.tsx`: Core subsystem for checking in children, managing parents, handling persistent PIN-entry sessions, and checkout lists.
*   `src/pages/EnhancedReportsPage.tsx`: Executive dashboard displaying volume intelligence, daily audit trails, child histories, and health logs.

---
*Last updated: 2026-05-16*
