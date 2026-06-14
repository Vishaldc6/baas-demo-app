# Data Schema Reference

> Unified schema for all tables (Supabase) and collections (Firebase). Both platforms use **identical names and field structures**.

---

## Collection/Table Names

| Name | Supabase | Firebase | Purpose |
|---|---|---|---|
| `profiles` | ✅ Table | ✅ Collection (`userRef`) | User profiles |
| `projects` | ✅ Table | ✅ Collection (`projectRef`) | Projects |
| `project_members` | ✅ Table | ✅ Collection (`projectMembersRef`) | Project membership + roles |
| `tasks` | ✅ Table | ✅ Collection (`tasksRef`) | Tasks within projects |
| `messages` | ✅ Table | ✅ Collection (`messagesRef`) | Chat messages per project |
| `invitations` | ✅ Table | ❌ Not used | Invitation flow (not implemented) |

---

## 1. `profiles`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | — | PK, FK to `auth.users.id` |
| `username` | text | NO | — | Derived from email prefix on signup |
| `avatar_url` | text | YES | `null` | URL to uploaded avatar |
| `created_at` | timestamptz | NO | `now()` | Profile creation time |
| `updated_at` | timestamptz | NO | `now()` | Last update time |

**Constraints:**
- PK: `profiles_pkey` on `id`
- FK: `profiles_id_fkey` → `auth.users.id`
- No unique constraint on `username` (by design)

**Supabase RLS:**
- SELECT: public (anyone can read any profile)
- INSERT: `auth.uid() = id`
- UPDATE: `auth.uid() = id`
- DELETE: `auth.uid() = id`

---

## 2. `projects`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `name` | text | NO | — | Project name |
| `description` | text | YES | `null` | Project description |
| `color` | text | YES | `null` | Hex color for UI display |
| `icon` | text | YES | `null` | Icon name for UI display |
| `created_by` | UUID | NO | — | FK to `profiles.id` |
| `created_at` | timestamptz | NO | `now()` | Creation time |
| `updated_at` | timestamptz | NO | `now()` | Last update time |

**Supabase RLS:** ⚠️ Currently DISABLED — needs policies

**Supabase Trigger:** `handle_new_project` — auto-inserts creator as `owner` in `project_members`

---

## 3. `project_members`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID / string | NO | `gen_random_uuid()` (Supabase) or `{projectId}_{userId}` (Firebase) | PK |
| `project_id` | UUID | NO | — | FK to `projects.id` |
| `user_id` | UUID | NO | — | FK to `profiles.id` |
| `role` | enum: `owner`, `member` | NO | `'member'` | User's role in the project |
| `joined_at` | timestamptz | NO | `now()` | When user joined |

**Supabase RLS:** ⚠️ Currently DISABLED — needs policies

**Unique constraint (Supabase):** `UNIQUE(project_id, user_id)` — prevents duplicate memberships

**Firebase:** Uses composite document ID `{projectId}_{userId}` to prevent duplicates

---

## 4. `tasks`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `project_id` | UUID | NO | — | FK to `projects.id` |
| `title` | text | NO | — | Task title |
| `description` | text | YES | `null` | Task description |
| `status` | enum | NO | `'todo'` | `todo`, `in_progress`, `in_review`, `done`, `cancelled` |
| `priority` | enum | NO | `'none'` | `none`, `low`, `medium`, `high`, `urgent` |
| `assignee_id` | UUID | YES | `null` | FK to `profiles.id` — assigned member |
| `created_by` | UUID | NO | — | FK to `profiles.id` — who created it |
| `due_date` | date | YES | `null` | Optional deadline |
| `position` | integer | NO | `0` | For ordering/sorting |
| `created_at` | timestamptz | NO | `now()` | Creation time |
| `updated_at` | timestamptz | NO | `now()` | Last update time |

**Supabase Trigger:** `validate_task_assignee` — ensures assignee is a project member before INSERT/UPDATE

---

## 5. `messages`

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `project_id` | UUID | NO | — | FK to `projects.id` |
| `sender_id` | UUID | NO | — | FK to `profiles.id` |
| `content` | text | NO | — | Message text |
| `mentions` | UUID[] | NO | `'{}'` | Supabase only — mentioned users |
| `reply_to_id` | UUID | YES | `null` | Supabase only — parent message for replies |
| `is_edited` | boolean | NO | `false` | Supabase only |
| `is_deleted` | boolean | NO | `false` | Supabase only |
| `created_at` | timestamptz | NO | `now()` | Message timestamp |
| `updated_at` | timestamptz | NO | `now()` | Supabase only |

> **Firebase Note:** Firestore documents only store `project_id`, `sender_id`, `content`, `created_at`. The extra fields (`mentions`, `reply_to_id`, `is_edited`, `is_deleted`, `updated_at`) are Supabase-only and not yet used in the app.

**Supabase Trigger:** `prevent_message_sender_change` — blocks updates to `sender_id`

---

## 6. `invitations` (Supabase Only — Not Implemented in App)

| Field | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `project_id` | UUID | NO | — | FK to projects |
| `invited_by` | UUID | NO | — | FK to profiles |
| `invited_email` | text | NO | — | Email of invitee |
| `token` | text | NO | — | Unique invitation token |
| `role` | enum | NO | `'member'` | Role to assign on acceptance |
| `status` | enum | NO | `'pending'` | `pending`, `accepted`, `declined`, `expired` |
| `expires_at` | timestamptz | NO | `now() + 7 days` | Auto-expiry |
| `created_at` | timestamptz | NO | `now()` | Creation time |

---

## Supabase Database Functions

| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger on `auth.users` INSERT → creates `profiles` row |
| `handle_new_project()` | Trigger on `projects` INSERT → creates `project_members` row (owner) |
| `handle_updated_at()` | Trigger on UPDATE → sets `updated_at = now()` |
| `validate_task_assignee()` | Trigger on `tasks` INSERT/UPDATE → validates assignee is project member |
| `prevent_message_sender_change()` | Trigger on `messages` UPDATE → blocks `sender_id` modification |
| `is_project_member(p_project_id, p_user_id)` | Helper function → checks membership existence |
| `is_project_owner(p_project_id, p_user_id)` | Helper function → checks if user is project owner |

### Firebase Equivalents
Firebase has **no server-side triggers** in this project. All the above logic is handled **client-side** in the service layer:
- Profile creation → manual `setDoc()` in `auth.ts`
- Owner membership → manual batch write in `project.ts`
- `updated_at` → manual `serverTimestamp()` in each update call
- Assignee validation → ❌ not implemented
- Sender protection → ❌ not implemented

---

## Firebase Collection References

Defined in `services/firebase/config.ts`:

```typescript
export const userRef = collection(db, 'profiles');
export const projectRef = collection(db, 'projects');
export const projectMembersRef = collection(db, 'project_members');
export const tasksRef = collection(db, 'tasks');
export const messagesRef = collection(db, 'messages');
```
