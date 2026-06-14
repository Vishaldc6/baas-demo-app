# Feature: Storage

> Upload and serve files using Firebase Storage and Supabase Storage. Used for avatar images and task attachments.

---

## Feature Scope

| Capability | Firebase | Supabase |
|---|---|---|
| Avatar image upload | ✅ | ✅ |
| Avatar image serve (public URL) | ✅ | ✅ |
| Task attachment upload | ❌ Not implemented | ✅ (partially — column pending) |
| Task attachment serve | ❌ | ✅ |

---

## Comparison: Firebase Storage vs Supabase Storage

### Architecture

| Aspect | Firebase Storage | Supabase Storage |
|---|---|---|
| **Underlying system** | Google Cloud Storage | S3-compatible object storage |
| **Bucket concept** | Single default bucket (configurable) | Named buckets (`avatars`, `task-attachments`) |
| **SDK** | `firebase/storage` — `ref()`, `uploadBytes()`, `getDownloadURL()` | `supabase.storage.from('bucket')` — `.upload()`, `.getPublicUrl()` |
| **URL type** | **Signed download URL** (token-based, long-lived) | **Public URL** (if bucket is public) or signed URL |
| **Access control** | Firebase Storage Security Rules | Supabase Storage policies (RLS-like) |
| **Path reference** | `ref(storage, 'path/to/file')` | String path `'folder/file.ext'` |

---

## Avatar Upload

Both platforms follow the same pattern:

```
Image Picker → fetch() as blob → upload to storage → get URL → update profile.avatar_url
```

### Firebase Implementation (`services/firebase/profile.ts`)

```typescript
// Path: avatars/{userId}/avatar.{ext}
const storagePath = `avatars/${userId}/${fileName}`;
const storageRef = ref(storage, storagePath);

// Upload
await uploadBytes(storageRef, blob, { contentType: `image/${ext}` });

// Get URL — returns a signed download URL with token
const downloadUrl = await getDownloadURL(storageRef);

// Update profile
await updateProfile(userId, { avatar_url: downloadUrl });
```

### Supabase Implementation (`services/supabase/profile.ts`)

```typescript
// Path: {userId}/avatar.{ext}
const filePath = `${userId}/${fileName}`;

// Upload to 'avatars' bucket (upsert overwrites existing)
await supabase.storage.from('avatars').upload(filePath, blob, {
  contentType: `image/${ext}`,
  upsert: true,
});

// Get URL — returns a public URL (no token needed if bucket is public)
const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

// Update profile
await updateProfile(userId, { avatar_url: publicUrl });
```

### Key Differences

| Aspect | Firebase | Supabase |
|---|---|---|
| **Storage path** | `avatars/{userId}/avatar.{ext}` | `{userId}/avatar.{ext}` (within `avatars` bucket) |
| **Overwrite behavior** | Overwrites by default (same path) | Requires `upsert: true` flag |
| **URL type** | Signed URL with `token` query param | Direct public URL |
| **URL stability** | URL changes if security rules change | URL is stable (path-based) |
| **Init** | `getStorage(app)` — separate SDK init | Uses same `supabase` client |

---

## Task Attachment Upload (Supabase Only)

### Supabase Implementation (`services/supabase/task.ts`)

```typescript
// Path: task-{taskId}/{fileName}
const filePath = `task-${taskId}/${fileName}`;

// Upload to 'task-attachments' bucket
await supabase.storage.from('task-attachments').upload(filePath, blob, {
  contentType: file.mimeType || 'application/octet-stream',
  upsert: true,
});

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('task-attachments')
  .getPublicUrl(filePath);
```

**Status:** ⚠️ Upload works but the `tasks` table doesn't have an `attachment` column yet — the code to update the task row is commented out.

### Firebase (Not Yet Implemented)

To implement parity, Firebase would need:
```typescript
// Path: task-attachments/task-{taskId}/{fileName}
const storagePath = `task-attachments/task-${taskId}/${fileName}`;
const storageRef = ref(storage, storagePath);
await uploadBytes(storageRef, blob, { contentType });
const downloadUrl = await getDownloadURL(storageRef);
```

---

## Storage Buckets / Paths Summary

| Purpose | Firebase Storage Path | Supabase Bucket + Path |
|---|---|---|
| Avatar | `avatars/{userId}/avatar.{ext}` | Bucket: `avatars`, Path: `{userId}/avatar.{ext}` |
| Task Attachment | `task-attachments/task-{taskId}/{fileName}` (planned) | Bucket: `task-attachments`, Path: `task-{taskId}/{fileName}` |

---

## Key Files

| File | Purpose |
|---|---|
| `services/firebase/profile.ts` → `uploadAvatar()` | Firebase avatar upload |
| `services/supabase/profile.ts` → `uploadAvatar()` | Supabase avatar upload |
| `services/supabase/task.ts` → `uploadTaskAttachment()` | Supabase task attachment upload |
| `services/firebase/config.ts` | Firebase Storage init: `getStorage(app)` |
| `services/supabase/config.ts` | Supabase client (storage accessed via `supabase.storage`) |

---

## Known Gaps

1. **Firebase task attachments**: Not implemented — needs `uploadTaskAttachment()` in `services/firebase/task.ts`
2. **Supabase attachment column**: `tasks` table needs an `attachment` column to store the URL
3. **Storage security**: Firebase Storage rules and Supabase Storage policies are not documented in this project
4. **File size limits**: No client-side validation on file size before upload
5. **Multiple attachments**: Current design supports one attachment per task — may need a separate `task_attachments` table for multiple
