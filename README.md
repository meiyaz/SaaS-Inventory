# SaaS Inventory Manager

A multi-tenant stock and project tracking SaaS explicitly built for hardware installation agencies.

## Core Tech
- React, Vite, Tailwind CSS, React Router
- Backend: Supabase (PostgreSQL, GoTrue, PostgREST)
- RBAC: Supabase Row Level Security (RLS) and custom JSONB permissions

## Architecture
- Single DB mapped via UUIDs leveraging `organization_members` cross-lookups.
- Full dynamic permission models restricting endpoint queries locally and via upstream RLS rules.


## Local Setup

```bash
# Clone and install dependencies
git clone https://github.com/meiyaz/saas-inventory.git
cd saas-inventory
npm install

# Setup environment variables
echo "VITE_SUPABASE_URL=your_url" > .env.local
echo "VITE_SUPABASE_ANON_KEY=your_key" >> .env.local
```

### Database Initialization

Apply the SQL migrations (`/sql`) in your Supabase project in this exact order:
1. `cleanup.sql` (Drops existing schema & policies)
2. `init_schema.sql` (Creates tables, RLS policies, and triggers)
3. `demo_data.sql` (Seeds an initial organization and auth users)

### Development Server

```bash
npm run dev
```