# BaaS Demo App — Project Brief

> **One app, two backends.** A React Native (Expo) demo that implements the same features using both Firebase and Supabase, allowing side-by-side comparison of these Backend-as-a-Service platforms.

---

## Why This Project Exists

This project is built for **demonstration and educational purposes**. It shows how the same mobile app features (auth, database, storage, and eventually cloud functions) can be implemented using two different BaaS platforms — **Firebase** and **Supabase** — with identical UI and user experience.

The goal is to compare:
- **Developer experience** — How easy is it to implement each feature?
- **Architecture differences** — Triggers vs manual inserts, SQL vs NoSQL, RLS vs Firestore rules
- **API patterns** — SDK differences, real-time capabilities, query patterns
- **Trade-offs** — What each platform does better or worse

---

## What It Does

A **project management app** with these core features:

| # | Feature | BaaS Services Used |
|---|---|---|
| 1 | **Sign Up / Sign In** | Auth |
| 2 | **User Profile** (view, edit, avatar upload) | Database + Storage |
| 3 | **Project Listing** (create, list, view details) | Database |
| 4 | **Add Members** to a project (search + invite) | Database |
| 5 | **Tasks** (create, assign to member, update status) | Database |
| 6 | **Chat** per project (send messages, real-time) | Database + Realtime |
| 7 | **Task Attachments** (upload documents to tasks) | Storage |

### NOT in scope (yet)
- Cloud Functions / Edge Functions (planned for later)
- Notifications / Activity Log (tables exist in Supabase but not actively used)
- Invitations flow (table exists but not implemented in the app)

---

## How It Works

### Provider Selection (Runtime)
The user selects **Firebase** or **Supabase** on the landing screen. This selection is stored in `AsyncStorage` and persisted across sessions. All subsequent operations route through the selected provider's service layer.

```
Landing Screen → Select Provider → Sign In/Up → Home (Tabs)
```

### Architecture

```
app/                          ← Screens (Expo Router, file-based routing)
├── index.tsx                 ← Provider selection screen
├── (auth)/                   ← Auth screens (sign-in, sign-up)
├── (tabs)/                   ← Main tab screens (home, chat, profile)
├── project/                  ← Project screens (create, detail)
├── task/                     ← Task screens (list, create)
└── chat/                     ← Chat screen (per project)

components/                   ← Shared components
├── AuthProvider.tsx           ← Auth context (provider switching, auth state, route guard)
├── AddMembersModal.tsx        ← Reusable modal for member selection
└── ProfileSheet.tsx           ← Profile bottom sheet

services/                     ← Backend service layer (THE KEY PART)
├── firebase/                 ← Firebase implementations
│   ├── config.ts             ← Firebase init + collection refs
│   ├── auth.ts               ← signIn, signUp, signOut
│   ├── profile.ts            ← getProfile, updateProfile, uploadAvatar
│   ├── project.ts            ← CRUD + members + search
│   ├── task.ts               ← CRUD + filters
│   ├── chat.ts               ← messages + realtime listener
│   └── index.ts              ← barrel exports
├── supabase/                 ← Supabase implementations
│   ├── config.ts             ← Supabase client init
│   ├── auth.ts               ← signIn, signUp, signOut
│   ├── profile.ts            ← getProfile, updateProfile, uploadAvatar
│   ├── project.ts            ← CRUD + members + search
│   ├── project_members.ts    ← member-specific operations
│   ├── task.ts               ← CRUD + filters + attachment upload
│   ├── chat.ts               ← messages + realtime subscription
│   ├── notification.ts       ← notifications (partially implemented)
│   └── index.ts              ← barrel exports

constants/
└── Theme.ts                  ← Design tokens (colors, spacing, radius)
```

### Data Flow Pattern
```
Screen → useAuth() to get provider → if firebase: FirebaseService.fn() else: SupabaseService.fn()
```

All screens import both service modules and conditionally call the right one based on `provider` from `AuthProvider`.

---

## Critical Rules for AI Agents

### 1. Naming Consistency
- **Table/Collection names MUST be identical** across Firebase and Supabase
- Current names: `profiles`, `projects`, `project_members`, `tasks`, `messages`
- If you add a new entity, use the SAME name for both the Supabase table and the Firebase Firestore collection

### 2. Service Function Signatures
- Firebase and Supabase service files for the same feature MUST have **matching function names and signatures**
- Example: Both must export `getProjectList(userId)`, `createProject(userId, data, members)`, etc.

### 3. Field/Column Naming
- Use **snake_case** for all field names (both Firestore document fields and Supabase columns)
- Common fields across all entities: `id`, `created_at`, `updated_at`

### 4. No Username Uniqueness
- Username is derived from email prefix (`email.split('@')[0]`)
- Duplicate usernames are allowed — email uniqueness is enforced by the auth layer

### 5. Document Structure
- Read the **per-feature docs** (`FEATURE_*.md`) before implementing any feature
- Each feature doc explains the comparison between Firebase and Supabase approaches

---

## Related Documentation

| Document | Purpose |
|---|---|
| [FEATURE_AUTH.md](./FEATURE_AUTH.md) | Auth: signup, signin, signout comparison |
| [FEATURE_PROFILE.md](./FEATURE_PROFILE.md) | Profile: CRUD, avatar upload comparison |
| [FEATURE_PROJECTS.md](./FEATURE_PROJECTS.md) | Projects + Members: CRUD, search, membership |
| [FEATURE_TASKS.md](./FEATURE_TASKS.md) | Tasks: CRUD, assignment, status updates |
| [FEATURE_CHAT.md](./FEATURE_CHAT.md) | Chat: messages, real-time comparison |
| [FEATURE_STORAGE.md](./FEATURE_STORAGE.md) | Storage: avatar + attachment uploads |
| [DATA_SCHEMA.md](./DATA_SCHEMA.md) | Unified data schema (all tables/collections) |
| [PROJECT_RULES.md](./PROJECT_RULES.md) | Coding conventions and anti-patterns |
| [FEATURE_TEMPLATE.md](./FEATURE_TEMPLATE.md) | Template for adding new features |
