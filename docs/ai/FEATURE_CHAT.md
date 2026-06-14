# Feature: Chat (Project Messages)

> Send and receive messages within a project. Real-time updates. No separate DM/member chat — only project-level group chat.

---

## Feature Scope

| Capability | Implemented? |
|---|---|
| Send message in project | ✅ |
| List messages in project (chat history) | ✅ |
| Real-time message updates | ✅ |
| Chat list (all projects with latest message) | ✅ |
| Reply to message | ❌ Not implemented (schema supports it) |
| Edit message | ❌ Not implemented (schema supports it) |
| Delete message (soft) | ❌ Not implemented (schema supports it) |
| Mentions | ❌ Not implemented (schema supports it) |
| Pagination | ❌ Not implemented (TODO) |

---

## Data Shape

### `messages` (table / collection)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `project_id` | UUID | FK to projects.id — which project's chat |
| `sender_id` | UUID | FK to profiles.id — who sent it |
| `content` | string | Message text |
| `created_at` | timestamp | Auto-set |
| `mentions` | UUID[] | Supabase only — mentioned user IDs (default: `{}`) |
| `reply_to_id` | UUID \| null | Supabase only — parent message ID for replies |
| `is_edited` | boolean | Supabase only — default: `false` |
| `is_deleted` | boolean | Supabase only — default: `false` |
| `updated_at` | timestamp | Supabase only |

> **Note:** Firebase Firestore documents only store: `project_id`, `sender_id`, `content`, `created_at`. The advanced fields (`mentions`, `reply_to_id`, `is_edited`, `is_deleted`) exist in the Supabase schema but are not used in the app yet.

---

## Comparison: Firebase vs Supabase

### Send Message

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | `addDoc(messagesRef, { project_id, sender_id, content, created_at: serverTimestamp() })` | `supabase.from('messages').insert({ project_id, sender_id, content }).select().single()` |
| **Timestamps** | Manual `serverTimestamp()` | DB default `now()` |
| **Returns** | `{ id: docRef.id, project_id, sender_id, content }` | Full `data` row |

### Get Project Messages (Chat History)

| Aspect | Firebase | Supabase |
|---|---|---|
| **Method** | `query(messagesRef, where('project_id', '==', id), orderBy('created_at', 'asc'))` | `supabase.from('messages').select('*').eq('project_id', id).order('created_at', { ascending: true })` |
| **Returns** | `snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))` | `data` array |

### Real-Time Messages

This is a **key comparison point** — the two platforms handle real-time very differently:

| Aspect | Firebase | Supabase |
|---|---|---|
| **Mechanism** | `onSnapshot()` — Firestore real-time listener | `supabase.channel().on('postgres_changes', ...)` — Postgres CDC via WebSocket |
| **What it returns** | **Full snapshot** — all matching documents every time | **Single new row** — only the INSERT payload |
| **Implementation** | `listenToProjectMessages(projectId, callback)` — callback receives entire message array | `listenToNewMessages(projectId, callback)` — callback receives single new message |
| **Unsubscribe** | Returns unsubscribe function from `onSnapshot` | Returns subscription object (call `.unsubscribe()`) |
| **Error handling** | Errors via snapshot listener | Status callbacks: `TIMED_OUT`, `CHANNEL_ERROR` |
| **Setup** | Works out of the box | Requires Supabase Realtime replication enabled for `messages` table |

#### Firebase Real-Time Pattern
```typescript
// Returns ALL messages on every change (add/modify/remove)
const unsubscribe = onSnapshot(query, (snapshot) => {
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  callback(messages); // Full array every time
});
```

#### Supabase Real-Time Pattern
```typescript
// Returns only the NEW message (INSERT event)
const subscription = supabase
  .channel(`project-messages-${projectId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `project_id=eq.${projectId}`,
  }, (payload) => {
    callback(payload.new); // Single new message
  })
  .subscribe();
```

### Chat List (Projects with Latest Message)

Both fetch the user's projects then get the latest message per project:

| Aspect | Firebase | Supabase |
|---|---|---|
| **Step 1** | Query `project_members` → get project IDs | Same |
| **Step 2** | For each project: `getDoc(projects/{id})` | Batch: `supabase.from('projects').select('*').in('id', ids)` |
| **Step 3** | For each project: query last message + fetch sender profile | For each project: query with join `select('content, created_at, sender:profiles!sender_id(username)')` |
| **N+1 problem** | Yes — many individual queries | Reduced — uses joins for sender name |
| **Sender name** | Separate `getDoc(profiles/{sender_id})` call | Joined in same query via FK |

---

## Supabase Automation

| Trigger/Function | Purpose |
|---|---|
| `prevent_message_sender_change` | Before UPDATE on `messages` — prevents changing `sender_id` after creation |
| `handle_updated_at` | Auto-sets `updated_at = now()` on update |

### Firebase Equivalent
- No triggers — no protection against sender_id changes
- No `updated_at` auto-management

---

## Key Files

| File | Purpose |
|---|---|
| `services/firebase/chat.ts` | `getProjectMessages`, `sendMessage`, `getUserProjectsWithLatestMessage`, `listenToProjectMessages` |
| `services/supabase/chat.ts` | `getProjectMessages`, `sendMessage`, `getUserProjectsWithLatestMessage`, `listenToNewMessages` |
| `app/chat/[id].tsx` | Chat screen for a specific project |
| `app/(tabs)/chat.tsx` | Chat list screen (all projects with latest message) |

---

## Known Inconsistencies

1. **Real-time function names differ**: `listenToProjectMessages` (Firebase) vs `listenToNewMessages` (Supabase)
2. **Real-time behavior differs**: Firebase returns full snapshot; Supabase returns single new record — the screen must handle these differently
3. **Firebase timestamp handling**: Firestore Timestamps need `.toMillis()` conversion for display; Supabase returns ISO strings
4. **Schema differences**: Firebase documents don't store `mentions`, `reply_to_id`, `is_edited`, `is_deleted` — these are Supabase-only columns not yet used in the app
