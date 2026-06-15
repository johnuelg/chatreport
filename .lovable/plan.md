

# Recreating Taif Children's Hospital App
## With Your Own Supabase Account for Full Data Ownership

---

## Overview

This plan provides a complete blueprint for recreating your Taif Children's Hospital Conversational AI Data Platform in a new Lovable project connected to your own Supabase account. This gives you full data ownership and control over your backend.

---

## Step 1: Create New Project & Connect Supabase

### Actions Required (You)

1. **Create New Lovable Project**
   - Go to [lovable.dev/projects](https://lovable.dev/projects)
   - Click "Create New Project"
   - Name it "Taif Children's Hospital" (or similar)
   - **Do NOT enable Lovable Cloud** when prompted

2. **Set Up Your Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project (or use existing)
   - Note these credentials:
     - Project URL
     - Anon/Public Key
     - Service Role Key

3. **Connect Supabase to Lovable**
   - In your new project: Settings → Connectors → Supabase
   - Enter your credentials
   - This auto-generates integration files

4. **Configure Auth Settings**
   - In Supabase Dashboard → Authentication → Settings
   - Enable Email Auth
   - Enable "Confirm email" (or disable for faster testing)
   - Add your Lovable preview URL to Site URL and Redirect URLs

---

## Step 2: Database Schema

Once connected, the following SQL migrations will recreate your database structure:

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, email, avatar) |
| `roles` | Dynamic role definitions (admin, doctor, etc.) |
| `user_roles` | Maps users to roles |
| `domains` | Hospital departments (ED, Radiology, Blood Bank, etc.) |
| `user_domains` | Maps users to accessible domains |
| `role_nav_permissions` | Controls which nav items each role can access |

### Chat System Tables

| Table | Purpose |
|-------|---------|
| `chat_conversations` | Stores conversation metadata with domain_id |
| `chat_messages` | Individual messages within conversations |
| `chat_bookmarks` | User-bookmarked messages with notes |
| `quick_questions` | Pre-defined questions per domain |

### Document Management Tables

| Table | Purpose |
|-------|---------|
| `documents` | Uploaded files with metadata and parsed content |
| `document_folders` | Folder organization with colors |
| `document_tags` | Tag definitions |
| `document_tag_assignments` | Document-to-tag mappings |
| `document_revisions` | Version history for replaced files |

### Storage Bucket

- `documents` bucket for file uploads (private, with RLS policies)

---

## Step 3: Row Level Security (RLS)

All tables will have RLS enabled with these policies:

| Table | Users | Admins |
|-------|-------|--------|
| profiles | View/update own | View all |
| user_roles | View own | Full CRUD |
| domains | View all | Full CRUD |
| chat_conversations | Full CRUD own | - |
| chat_messages | View/insert/delete own | - |
| chat_bookmarks | Full CRUD own | - |
| documents | View all | Full CRUD |
| document_folders | View all | Full CRUD |
| quick_questions | View active | Full CRUD |

A `has_role()` security definer function prevents RLS recursion.

---

## Step 4: Edge Functions

Six serverless functions to deploy:

| Function | Purpose | Required Secrets |
|----------|---------|------------------|
| `chat-perplexity` | AI chat with Perplexity API | `PERPLEXITY_API_KEY` |
| `analyze-image` | Image analysis for chat | Perplexity API |
| `parse-document` | Extract text from uploaded files | Lovable API |
| `admin-create-user` | Create users (admin only) | `SUPABASE_SERVICE_ROLE_KEY` |
| `admin-update-user` | Update users (admin only) | Service role key |
| `admin-delete-user` | Delete users (admin only) | Service role key |

**You'll need to add these secrets** in your Supabase project settings.

---

## Step 5: Application Features

### Phase 5.1: Foundation
- Supabase client integration
- Auth context with role management
- Language context (English/Arabic)
- Theme provider (light/dark mode)
- Routing setup

### Phase 5.2: Landing Page
- Animated hero section with typing effect
- About section
- Features section (AI Chatbot, Reports, Analysis, Dashboards)
- Domains showcase (ED, Radiology, Blood Bank, etc.)
- Footer with bilingual support
- Responsive navbar with language/theme toggles

### Phase 5.3: Authentication
- Login page with hospital branding
- Floating medical icon animations
- Language toggle
- Custom auth background SVG
- Form validation with Zod

### Phase 5.4: Dashboard Layout
- Responsive sidebar navigation
- Role-based nav filtering
- User avatar/role display
- Mobile hamburger menu
- Full RTL (Arabic) support

### Phase 5.5: Chat Assistant
- Domain-aware conversations
- Conversation history sidebar (collapsible)
- Real-time streaming responses
- Quick questions per domain
- Message bookmarking with notes
- Markdown rendering for AI responses
- Image upload & analysis
- PDF export of conversations
- Edit/regenerate messages

### Phase 5.6: Document Management
- Multi-file upload with progress
- Folder organization (drag-and-drop)
- Domain/category filtering
- Rich preview dialog (PDF, Word, Excel, images)
- Tag system
- Version history/revisions
- Document text parsing for AI context

### Phase 5.7: User Management (Admin)
- Create/edit/delete users
- Role assignment
- Domain assignment
- Password management

### Phase 5.8: Settings Pages
- Domain management (add/edit/delete/reorder)
- Role management with colors
- Quick questions configuration per domain
- Navigation permissions per role
- Language selection
- Chat history reset
- Password change

### Phase 5.9: Additional Pages
- Bookmarks page (saved messages with notes)
- Dashboard overview
- 404 Not Found page

---

## Step 6: Technical Implementation

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query
- **Routing**: React Router DOM v6
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (Supabase)

### Key Dependencies
```text
@supabase/supabase-js
@tanstack/react-query
react-router-dom
lucide-react
react-markdown + remark-gfm
recharts
date-fns
zod
@dnd-kit/core + @dnd-kit/sortable
papaparse + xlsx (spreadsheet parsing)
jspdf (PDF export)
mammoth (Word document parsing)
```

### Bilingual Support (English/Arabic)
- LanguageContext with 100+ translation keys
- RTL layout support (`dir="rtl"`)
- Font families: Poppins (English), Noto Sans Arabic

### Theme System
- Light/dark mode toggle
- CSS variables for colors
- Persistent preference in localStorage

---

## Step 7: Assets to Recreate

| Asset | Location |
|-------|----------|
| Hospital logo | `src/assets/hospital-logo.png` |
| App logo | `src/assets/logo.png` |
| Auth background SVG | `src/assets/auth-background.svg` |
| PWA icons | `public/pwa-192x192.png`, `public/pwa-512x512.png` |
| Favicon | `public/favicon.png` |

---

## Implementation Timeline

| Phase | Description | Est. Messages |
|-------|-------------|---------------|
| 1 | Database schema + migrations + RLS | 3-4 |
| 2 | Auth system + contexts | 2-3 |
| 3 | Landing page components | 3-4 |
| 4 | Dashboard layout + routing | 2-3 |
| 5 | Chat system (core + streaming) | 4-5 |
| 6 | Chat features (bookmarks, history, export) | 2-3 |
| 7 | Document management | 4-5 |
| 8 | User management (admin) | 2-3 |
| 9 | Settings pages | 3-4 |
| 10 | Edge functions | 3-4 |

**Total: ~28-38 messages**

---

## Ready to Start?

1. Create your new Lovable project at [lovable.dev/projects](https://lovable.dev/projects)
2. Set up and connect your Supabase account
3. Return to the new project and say "Let's start building the Taif Children's Hospital app"

I'll guide you through each phase step-by-step, starting with the database schema and authentication system.

---

## Summary

This recreation will give you:
- Complete data ownership on your Supabase account
- All existing features preserved
- Same design, animations, and UX
- Bilingual support (English/Arabic)
- Full admin control panel
- AI-powered chat with document context
- Comprehensive document management

