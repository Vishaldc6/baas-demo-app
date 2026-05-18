# Database Schema — Feature & Functionality Map

> [!NOTE]
> This document lists **every feature/functionality** achievable from the current database schema. No code or queries — just clear descriptions to guide mobile app implementation.

---

## 1. User Profiles (table: `profiles`)

### 1.1 Auto-Create Profile on Signup
- When a new user signs up via Supabase Auth, a profile row is **automatically created** (trigger: `on_auth_user_created`).
- `full_name` is pulled from signup metadata, defaults to `"New User"`.
- `username` is pulled from metadata, defaults to the part before `@` in the email.
- **Mobile implication:** No manual "create profile" call needed after signup — just redirect to home or onboarding.

### 1.2 View Own Profile
- Fetch the current user's profile (avatar, username, full name, bio, timezone).
- Use this for the **Profile / Settings screen**.

### 1.3 Edit Own Profile
- Update `username`, `full_name`, `avatar_url`, `bio`, `timezone`.
- `updated_at` auto-updates via trigger.
- **Mobile implication:** Profile edit screen with form fields for each column.

### 1.4 View Another User's Profile
- Look up any user by `id` or `username`.
- Useful for **tapping on a team member's avatar** to see their info.

### 1.5 Search Users by Username
- Search profiles where `username` matches a pattern (e.g., for inviting members).
- **Mobile implication:** Autocomplete / search bar when adding members to a project.

### 1.6 Upload / Change Avatar
- Update `avatar_url` (pair with Supabase Storage for actual file upload).
- **Mobile implication:** Image picker → upload to storage → save URL to profile.

---

## 2. Projects (table: `projects`)

### 2.1 Create a New Project
- Insert a row with `name`, `description`, `color`, `icon`.
- `created_by` is set to the current user's ID.
- **Auto-side-effect:** The creator is automatically added as `owner` in `project_members` (trigger: `on_project_created`).
- **Mobile implication:** "New Project" form → pick name, color, icon → done.

### 2.2 List Projects the User Belongs To
- Join `projects` ↔ `project_members` where `user_id = current user`.
- Returns all projects the user has joined (as owner or member).
- **Mobile implication:** Home screen / project list.

### 2.3 View Project Details
- Fetch a single project by `id` — name, description, color, icon, archived status, creator.
- **Mobile implication:** Project detail / overview screen.

### 2.4 Edit Project Details
- Update `name`, `description`, `color`, `icon`.
- Only project owners should be allowed (enforce via RLS or app logic).
- **Mobile implication:** "Edit Project" screen accessible from project settings.

### 2.5 Archive / Unarchive a Project
- Toggle `is_archived` to `true` or `false`.
- Archived projects can be hidden from the main list but still accessible.
- **Mobile implication:** Swipe action or menu option → "Archive Project". Separate "Archived" tab/filter.

### 2.6 Delete a Project
- Delete the project row → cascades to `project_members`, `tasks`, `messages`, `invitations`, `activity_log`.
- **Mobile implication:** Destructive action with confirmation dialog. Owner-only.

### 2.7 Filter Projects
- Filter by `is_archived`, `color`, `created_by`, or search by `name`.
- **Mobile implication:** Filter chips or search bar on the project list screen.

---

## 3. Project Members (table: `project_members`)

### 3.1 List All Members of a Project
- Fetch all `project_members` rows for a given `project_id`, join with `profiles` to get names/avatars.
- **Mobile implication:** Members list on the project detail screen, showing role badges (Owner / Member).

### 3.2 Check Current User's Role in a Project
- Query `project_members` where `project_id` + `user_id = current user`.
- Returns the user's `role` (`owner` or `member`).
- **Mobile implication:** Conditionally show admin controls (edit project, manage members, delete) only for owners.

### 3.3 Change a Member's Role
- Update `role` on a `project_members` row (e.g., promote member → owner).
- **Mobile implication:** Owner can tap a member → "Make Owner" option.

### 3.4 Remove a Member from a Project
- Delete the `project_members` row.
- **Mobile implication:** Owner can swipe or tap "Remove" on a member. Confirmation dialog.

### 3.5 Leave a Project
- Current user deletes their own `project_members` row.
- **Mobile implication:** "Leave Project" button in project settings. Warn if they're the last owner.

### 3.6 Count Members per Project
- Aggregate count of `project_members` per `project_id`.
- **Mobile implication:** Show member count badge on project cards in the list.

---

## 4. Invitations (table: `invitations`)

### 4.1 Invite a User to a Project (by Email)
- Insert a row with `project_id`, `invited_email`, `role`, auto-generated `token`.
- `invited_by` is the current user. Expires in 7 days by default.
- **Mobile implication:** "Invite Member" button → enter email → pick role → send.

### 4.2 List Pending Invitations for a Project
- Fetch all `invitations` where `project_id` matches and `status = 'pending'`.
- **Mobile implication:** Show pending invites in the members section with a "Pending" badge.

### 4.3 Cancel / Revoke an Invitation
- Update `status` to `'expired'` or delete the row.
- **Mobile implication:** Owner can cancel a pending invite from the members list.

### 4.4 Accept an Invitation
- Update `status` to `'accepted'` → then insert a `project_members` row for the invited user.
- **Mobile implication:** User receives invite (via email/notification) → taps "Accept" → joins the project.

### 4.5 Decline an Invitation
- Update `status` to `'declined'`.
- **Mobile implication:** User taps "Decline" on an invite notification/screen.

### 4.6 List Invitations Received by a User
- Fetch `invitations` where `invited_email` matches the current user's email and `status = 'pending'`.
- **Mobile implication:** "Invitations" tab or badge on the home screen / notification area.

### 4.7 Check if Invitation Has Expired
- Compare `expires_at` with current time. Auto-mark as `'expired'` if past.
- **Mobile implication:** Show "Expired" badge or hide expired invitations.

### 4.8 Resend / Regenerate an Invitation
- Delete the old invitation → create a new one with a fresh token and expiry.
- **Mobile implication:** "Resend Invite" button on expired/pending invitations.

### 4.9 Accept Invitation via Token (Deep Link)
- Look up invitation by `token` → validate status & expiry → accept.
- **Mobile implication:** Email contains a deep link with the token → app opens → auto-accept flow.

---

## 5. Tasks (table: `tasks`)

### 5.1 Create a Task
- Insert with `project_id`, `title`, `description`, `status`, `priority`, `assignee_id`, `due_date`, `position`.
- `created_by` is the current user.
- **Mobile implication:** "Add Task" form within a project → title, description, priority picker, assignee picker, due date picker.

### 5.2 List All Tasks in a Project
- Fetch `tasks` where `project_id` matches.
- **Mobile implication:** Task list screen inside a project.

### 5.3 Filter Tasks by Status (Kanban / Board View)
- Group tasks by `status`: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`.
- **Mobile implication:** Kanban board with columns, or filter tabs/chips at the top.

### 5.4 Filter Tasks by Priority
- Filter by `priority`: `none`, `low`, `medium`, `high`, `urgent`.
- **Mobile implication:** Priority filter dropdown or color-coded badges.

### 5.5 Filter Tasks by Assignee
- Filter where `assignee_id` matches a specific user.
- **Mobile implication:** "Filter by Member" in the task list.

### 5.6 Get Tasks Assigned to Current User (My Tasks)
- Fetch all `tasks` where `assignee_id = current user`, optionally across all projects.
- **Mobile implication:** Global "My Tasks" screen showing everything assigned to the user, grouped by project.

### 5.7 Get Tasks Created by Current User
- Fetch `tasks` where `created_by = current user`.
- **Mobile implication:** "Tasks I Created" filter or section.

### 5.8 View Task Details
- Fetch a single task by `id` — all fields including title, description, status, priority, assignee, due date.
- **Mobile implication:** Task detail screen with all info displayed.

### 5.9 Edit a Task
- Update `title`, `description`, `status`, `priority`, `assignee_id`, `due_date`.
- `updated_at` auto-updates via trigger.
- **Mobile implication:** Inline editing or "Edit Task" screen.

### 5.10 Change Task Status (Drag & Drop / Quick Action)
- Update only the `status` field.
- **Mobile implication:** Swipe action or status dropdown on the task card. Also supports drag-and-drop in Kanban.

### 5.11 Change Task Priority
- Update only the `priority` field.
- **Mobile implication:** Tap priority badge → picker to change.

### 5.12 Assign / Reassign a Task
- Update `assignee_id` to a different user or `null` (unassign).
- **Mobile implication:** Tap assignee avatar → member picker modal.

### 5.13 Reorder Tasks (Position)
- Update `position` values to change the display order within a status column.
- **Mobile implication:** Drag-and-drop reordering within a list or board.

### 5.14 Delete a Task
- Delete the task row.
- **Mobile implication:** Swipe-to-delete or menu option with confirmation.

### 5.15 Get Overdue Tasks
- Filter tasks where `due_date < today` and `status` is not `done` or `cancelled`.
- **Mobile implication:** "Overdue" badge on tasks, or a dedicated overdue filter.

### 5.16 Get Tasks Due Today / This Week
- Filter by `due_date` range.
- **Mobile implication:** "Due Today" and "Due This Week" quick filters.

### 5.17 Task Statistics per Project
- Count tasks grouped by `status` or `priority` for a given project.
- **Mobile implication:** Dashboard/overview showing progress bars, pie charts, or stat cards (e.g., "5 To Do, 3 In Progress, 8 Done").

### 5.18 Unassigned Tasks
- Filter tasks where `assignee_id IS NULL`.
- **Mobile implication:** "Unassigned" filter to find tasks that need owners.

---

## 6. Messages / Chat (table: `messages`)

### 6.1 Send a Message in a Project
- Insert with `project_id`, `content`, `sender_id`.
- **Mobile implication:** Chat input at the bottom of the project chat screen.

### 6.2 List Messages in a Project (Chat History)
- Fetch `messages` where `project_id` matches, ordered by `created_at`.
- **Mobile implication:** Scrollable chat view with messages, paginated (load older on scroll up).

### 6.3 Reply to a Message
- Insert a message with `reply_to_id` pointing to the parent message.
- **Mobile implication:** Swipe on a message → reply. Show the quoted parent message above the reply.

### 6.4 Edit a Message
- Update `content` and set `is_edited = true`.
- **Mobile implication:** Long-press → "Edit" → modify text. Show "(edited)" label.

### 6.5 Delete a Message (Soft Delete)
- Set `is_deleted = true` (content can be hidden but row remains).
- **Mobile implication:** Long-press → "Delete". Show "This message was deleted" placeholder.

### 6.6 Mention Users in a Message
- Store mentioned user IDs in the `mentions` array.
- **Mobile implication:** Type `@` → show member autocomplete → select user. Highlighted mention text in the message bubble.

### 6.7 Get Messages Where Current User is Mentioned
- Fetch messages where current user's ID is in the `mentions` array.
- **Mobile implication:** "Mentions" filter in chat, or notification when mentioned.

### 6.8 Real-Time Chat (Supabase Realtime)
- Subscribe to `INSERT` events on `messages` for a given `project_id`.
- **Mobile implication:** New messages appear instantly without refresh. Typing indicators can be built separately.

### 6.9 Message Thread View
- Fetch all messages where `reply_to_id` matches a specific message.
- **Mobile implication:** Tap a message → see thread of replies.

### 6.10 Paginated Message Loading
- Use `created_at` cursor-based pagination.
- **Mobile implication:** "Load More" or infinite scroll upward for older messages.

---

## 7. Notifications (table: `notifications`)

### 7.1 List All Notifications for the User
- Fetch `notifications` where `user_id = current user`, ordered by `created_at DESC`.
- **Mobile implication:** Notification list screen / bell icon dropdown.

### 7.2 Mark a Notification as Read
- Update `is_read = true` on a specific notification.
- **Mobile implication:** Tap on a notification → mark as read and navigate to relevant screen.

### 7.3 Mark All Notifications as Read
- Bulk update `is_read = true` for all notifications of the current user.
- **Mobile implication:** "Mark All as Read" button at the top of the notification list.

### 7.4 Get Unread Notification Count
- Count `notifications` where `user_id = current user` and `is_read = false`.
- **Mobile implication:** Badge number on the notification bell icon or tab bar.

### 7.5 Real-Time Notifications (Supabase Realtime)
- Subscribe to `INSERT` events on `notifications` where `user_id = current user`.
- **Mobile implication:** Push-style in-app alerts / toast banners when a new notification arrives.

### 7.6 Notification Types & Routing
- The `type` field determines what happened (e.g., `"task_assigned"`, `"message_mention"`, `"invitation_received"`, `"project_update"`).
- The `data` JSONB field contains contextual IDs (e.g., `{ "project_id": "...", "task_id": "..." }`).
- **Mobile implication:** Tap notification → deep link to the correct screen based on `type` + `data`.

### 7.7 Identify Who Triggered the Notification
- `actor_id` references the user who caused the notification.
- Join with `profiles` to show "**John** assigned you a task".
- **Mobile implication:** Show actor's avatar + name in the notification row.

### 7.8 Delete Old / Read Notifications
- Delete notifications older than a threshold or already read.
- **Mobile implication:** Periodic cleanup or "Clear All" button.

### 7.9 Filter Notifications by Type
- Filter by `type` (e.g., show only task notifications, only mentions).
- **Mobile implication:** Filter tabs/chips on the notification screen.

---

## 8. Activity Log (table: `activity_log`)

### 8.1 Log an Activity
- Insert a row whenever a significant action happens (task created, member added, project updated, etc.).
- Fields: `project_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`.
- **Mobile implication:** Log entries are created from app logic or database triggers/functions.

### 8.2 View Project Activity Feed
- Fetch `activity_log` for a given `project_id`, ordered by `created_at DESC`.
- **Mobile implication:** "Activity" tab inside a project showing a timeline of all actions.

### 8.3 Filter Activity by Action Type
- Filter by `action` (e.g., `"task_created"`, `"member_joined"`, `"task_status_changed"`).
- **Mobile implication:** Filter chips on the activity feed.

### 8.4 Filter Activity by Entity Type
- Filter by `entity_type` (e.g., `"task"`, `"project"`, `"member"`).
- **Mobile implication:** "Show only task changes" filter.

### 8.5 View Activity for a Specific Entity
- Filter by `entity_type` + `entity_id` to see all changes to a single task, project, etc.
- **Mobile implication:** On the task detail screen, show "History" or "Changes" section.

### 8.6 Identify Who Did What
- `actor_id` joined with `profiles` shows which user performed each action.
- **Mobile implication:** "**Alice** changed status from *todo* to *in_progress*" with avatar.

### 8.7 Activity Metadata
- `metadata` JSONB stores extra context (e.g., `{ "old_status": "todo", "new_status": "in_progress" }`).
- **Mobile implication:** Rich activity descriptions showing what changed.

---

## 9. Cross-Cutting / Composite Features

These features combine multiple tables:

### 9.1 Dashboard / Home Screen
- **My Projects:** `projects` ↔ `project_members`
- **My Tasks (across projects):** `tasks` where `assignee_id = me`
- **Unread Notifications count:** `notifications` where `is_read = false`
- **Pending Invitations:** `invitations` where `invited_email = my email` and `status = 'pending'`

### 9.2 Project Overview Screen
- **Project details:** `projects`
- **Member count & list:** `project_members` ↔ `profiles`
- **Task stats:** `tasks` grouped by status
- **Recent activity:** `activity_log` (last N entries)
- **Pending invitations:** `invitations` where `status = 'pending'`

### 9.3 User Profile Screen (Viewing Another User)
- **Profile info:** `profiles`
- **Shared projects:** `project_members` where both users are members
- **Tasks assigned to them:** `tasks` where `assignee_id = that user` (within shared projects)

### 9.4 Global Search
- Search across `projects.name`, `tasks.title`, `profiles.username`, `messages.content`.
- **Mobile implication:** Universal search bar on the home screen.

### 9.5 Permission / Access Control Summary
| Action | Who Can Do It |
|---|---|
| Create project | Any authenticated user |
| Edit/Delete project | Project owner only |
| Archive project | Project owner only |
| Invite members | Project owner (or member, based on RLS) |
| Remove members | Project owner only |
| Create task | Any project member |
| Assign task | Any project member |
| Edit/Delete task | Creator or project owner |
| Send message | Any project member |
| Edit/Delete own message | Message sender only |
| View notifications | Notification owner only |

### 9.6 Onboarding Flow
1. User signs up → profile auto-created.
2. Check for pending invitations by email → show invite acceptance screen.
3. If no invites → prompt to create first project.
4. After project created → prompt to invite team members.
5. After members join → prompt to create first task.

### 9.7 Offline Considerations
- All tables have `created_at` / `updated_at` — can be used for **sync timestamps**.
- UUIDs as primary keys enable **client-side ID generation** for optimistic updates.
- `position` on tasks enables **offline reordering** with conflict resolution on sync.

---

## 10. Realtime Features (Supabase Realtime)

The schema mentions enabling realtime on `messages` and `notifications`:

| Feature | Table | Event |
|---|---|---|
| Live chat | `messages` | `INSERT`, `UPDATE` |
| Live notifications | `notifications` | `INSERT` |
| Task board sync | `tasks` | `INSERT`, `UPDATE`, `DELETE` |
| Member presence | `project_members` | `INSERT`, `DELETE` |

---

## Quick Reference — Feature Count by Module

| Module | Feature Count |
|---|---|
| Profiles | 6 |
| Projects | 7 |
| Project Members | 6 |
| Invitations | 9 |
| Tasks | 18 |
| Messages | 10 |
| Notifications | 9 |
| Activity Log | 7 |
| Cross-Cutting | 7 |
| **Total** | **~79 features** |
