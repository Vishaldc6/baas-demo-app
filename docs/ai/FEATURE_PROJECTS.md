# Feature: Projects & Members

> Create projects, list user's projects, view project details, search users, add members to projects.

---

## Feature Scope

| Capability | Implemented? |
|---|---|
| Create project (name, description, color, icon) | ✅ |
| List projects the user belongs to | ✅ |
| View project details | ✅ |
| Add members to a project (search + select) | ✅ |
| List project members with roles | ✅ |
| Get current user's role in project | ✅ |
| Search users by keyword/username | ✅ |
| Auto-add creator as owner | ✅ |
| Edit project | ❌ Not implemented (TODO) |
| Delete project | ❌ Not implemented (TODO) |
| Remove member | ❌ Not implemented (TODO) |
| Invitation flow (email-based) | ❌ Table exists but not implemented |

---

## Data Shape

### `projects` (table / collection)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `name` | string | Required |
| `description` | string \| null | Optional |
| `color` | string \| null | Hex color for UI |
| `icon` | string \| null | Icon name for UI |
| `created_by` | UUID | FK to profiles.id |
| `created_at` | timestamp | Auto-set |
| `updated_at` | timestamp | Auto-set |

### `project_members` (table / collection)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / string | Auto-generated (Supabase) or `{projectId}_{userId}` (Firebase) |
| `project_id` | UUID | FK to projects.id |
| `user_id` | UUID | FK to profiles.id |
| `role` | enum: `owner` \| `member` | Default: `member` |
| `joined_at` | timestamp | Auto-set |

---

## Comparison: Firebase vs Supabase

### Create Project

| Aspect | Firebase | Supabase |
|---|---|---|
| **Create project** | `setDoc(projectDocRef, { id, ...data, created_by, created_at, updated_at })` | `supabase.from('projects').insert({ name, description, color, icon, created_by }).select('id').single()` |
| **Auto-add owner** | **Manual** — app inserts owner membership in same batch write | **Automatic** — DB trigger `handle_new_project` inserts owner row |
| **Add initial members** | Batch write (`writeBatch`) — all members in one atomic operation | Sequential `supabase.from('project_members').insert(membersToInsert)` |
| **Document ID** | Client-generated via `doc(collection(db, 'projects'))` | Server-generated UUID |
| **Member doc ID** | Composite: `${projectId}_${userId}` (prevents duplicates) | Auto-generated UUID (unique constraint on `project_id, user_id`) |

### List Projects (for current user)

| Aspect | Firebase | Supabase |
|---|---|---|
| **Step 1** | Query `project_members` where `user_id == userId` | Query `project_members` where `user_id = userId` |
| **Step 2** | For each project_id → `getDoc(projects/{id})` | Batch query `projects` with `in('id', projectIds)` |
| **Step 3** | For each project → query members + count tasks | Batch query `project_members` + `tasks` with `in('project_id', ...)` |
| **N+1 problem** | Yes — multiple individual `getDoc` calls | No — uses batch `in()` queries |
| **Joins** | Not available — manual multi-query | Could use Supabase joins but currently does manual multi-query too |

### Search Users

| Aspect | Firebase | Supabase |
|---|---|---|
| **Function name** | `searchUsersByEmail` (actually searches username) | `searchUsersByKeyword` |
| **Method** | Prefix search: `where('username', '>=', searchLower)` + `where('username', '<=', searchLower + '\uf8ff')` | `ilike` pattern: `.or('username.ilike.%${searchString}%')` |
| **Case sensitivity** | Case-sensitive prefix only | Case-insensitive substring match |
| **Exclude self** | Filters out `currentUserId` client-side | Filters via `.neq('id', currentUserId)` in query |
| **Limit** | No explicit limit | `.limit(20)` |

> **Note:** Function names differ (`searchUsersByEmail` vs `searchUsersByKeyword`). These should be aligned for consistency.

### Add Members to Project

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | `writeBatch` — checks existence first, then batch set | `supabase.from('project_members').upsert(members, { onConflict, ignoreDuplicates: true })` |
| **Duplicate prevention** | Manual `checkMembershipExists()` query before insert | DB unique constraint + `ignoreDuplicates: true` |
| **Atomicity** | Atomic batch write | Single upsert call |

### Get Project Members

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | Query `project_members` → for each, `getDoc(profiles/{user_id})` | Single query with join: `.select('user_id, role, profiles:user_id(id, username, avatar_url)')` |
| **N+1 problem** | Yes — one profile fetch per member | No — Supabase joins handle it |
| **Returns** | `{ id, name, avatar, role }` | Same shape |

---

## Supabase Automation

| Trigger | Table | Function | Purpose |
|---|---|---|---|
| `on_project_created` | `projects` | `handle_new_project` | Auto-inserts creator as `owner` in `project_members` |
| `handle_updated_at` | `projects` | `handle_updated_at` | Auto-updates `updated_at` on project changes |

### Firebase Equivalent
- No triggers — owner membership is inserted manually in `createProject()` via batch write
- `updated_at` must be set manually with `serverTimestamp()`

---

## Key Files

| File | Purpose |
|---|---|
| `services/firebase/project.ts` | `getProjectList`, `getProjectById`, `createProject`, `searchUsersByEmail`, `getProjectMembers`, `getCurrentUserRole`, `addMembersToProject` |
| `services/supabase/project.ts` | `getProjectList`, `getProjectById`, `createProject`, `searchUsersByKeyword`, `addMembersToProject` |
| `services/supabase/project_members.ts` | `getProjectMembers`, `getCurrentUserRole` |
| `app/(tabs)/home.tsx` | Project list screen |
| `app/project/create.tsx` | Project creation form + member selection |
| `app/project/[id].tsx` | Project detail screen |
| `components/AddMembersModal.tsx` | Reusable member search + selection modal |

---

## Known Inconsistencies

1. **Search function names differ**: `searchUsersByEmail` (Firebase) vs `searchUsersByKeyword` (Supabase) — should be aligned
2. **Member operations split**: Supabase has a separate `project_members.ts` file; Firebase puts member functions in `project.ts` — consider aligning
3. **Search capability differs**: Firebase does prefix-only search; Supabase does substring match
