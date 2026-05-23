# Project Rules

## Conventions
- **Routing**: Expo Router with `app/` directory; route groups `(tabs)` (bottom tabs) and `(auth)` (auth flow)
- **State**: Auth state via `AuthProvider` (React Context); UI state via `useState` in components
- **Styling**: `constants/Theme.ts` for design tokens; `StyleSheet.create()`; `expo-linear-gradient` for gradients
- **Services**: Separate Firebase/Supabase implementations under `services/` with matching function signatures
- **Imports**: Use `@/` alias for absolute imports (e.g., `@/components/AuthProvider`, `@/constants/Theme`)
- **Naming**: PascalCase for React components, camelCase for functions/variables/constants
- **Files**: One component/service per file; avoid large files (>300 lines considered large)
- **Exports**: Named exports for functions/services; default exports for React components

## Constraints
- **No State Management Library**: No Zustand/Redux; rely on Context (`AuthProvider`) and local state (`useState`)
- **No Data Fetching Library**: No React Query/SWR; manual `useEffect` for data fetching, service functions for mutations
- **Dual Backend**: Code must support both Firebase and Supabase (provider selected at runtime via AuthProvider)
- **Expo Constraints**: Use expo-compatible libraries; avoid native modules without expo support (check expo docs)
- **AsyncStorage**: Used for auth persistence (user/profile data); avoid storing sensitive long-term tokens
- **TypeScript**: Strict typing expected; leverage service function return types for screen state

## Anti-Patterns
- **Duplicated Logic**: Repeated provider conditional checks (`if (provider === "firebase") ... else`) in screens
  - *Preferred*: Keep provider logic in services; screens call consistent service interface
- **Heavy Screens**: Large screens mixing UI, data fetching, business logic, and state management
  - *Preferred*: Extract complex UI to components, business logic to services/custom hooks
- **Inconsistent Service Structure**: Firebase and Supabase services should mirror function signatures and naming
  - *Example inconsistency*: `searchUsersByEmail` (Firebase) vs `searchUsersByKeyword` (Supabase)
- **Hardcoded Values**: Avoid magic numbers/strings; use Theme constants or service parameters
- **Blocking UI**: Long-running tasks without loading states (some services use artificial delays)
- **Poor Error Handling**: Silent errors or console-only errors; should show user-friendly feedback
- **Inconsistent Styling**: Inline styles instead of StyleSheet; hardcoded colors instead of Theme values

## Preferred Approaches
- **Service Abstraction**: Backend calls confined to service files; screens only call service functions
- **Provider Encapsulation**: Handle Firebase/Supabase differences in services, not in screens
- **Loading States**: Show activity indicators or skeleton UI during async operations (see AuthProvider example)
- **Error Boundaries**: Use try/catch; display errors via Alert, toast, or UI feedback (toast not observed but recommended)
- **Modular Components**: Extract repeated UI patterns (cards, buttons, avatars, modals) to shared components
- **Type Safety**: Use TypeScript interfaces from services (e.g., `ProfileData`) for screen state and props
- **Feature Grouping**: Organize complex features in route groups (`app/feature/`) with index/create/[id] structure
- **Navigation Consistency**: Use expo-router's `useRouter()` and `<Link>` consistently for navigation

## Reusable Reference Features
- **Auth System**: `components/AuthProvider.tsx` (context, persistence, route guarding, provider switching)
- **Project Listing**: `app/(tabs)/home.tsx` (FlatList, card layout, FAB, conditional service calls, refresh pattern)
- **Project Detail**: `app/project/[id].tsx` (reference for detail screen with data fetching and actions)
- **Project Creation**: `app/project/create.tsx` (reference for form with submit logic, modal integration, member selection)
- **Profile Screen**: `app/(tabs)/profile.tsx` (reference for user profile display and edit patterns)
- **Chat Feature**: `app/chat/[id].tsx` (reference for real-time-ish feature, message list, input handling)
- **Add Members Modal**: `components/AddMembersModal.tsx` (reusable modal pattern with callback props)
- **Task Feature**: `app/task/` (index/create screens showing simple feature implementation)

## Implementation Guidelines
1. **Start with Services**: Implement Firebase and Supabase service functions before screens
2. **Maintain Consistency**: Keep Firebase/Supabase service function signatures identical
3. **Handle Loading**: Always show loading state during async operations (use ActivityIndicator or skeleton UI)
4. **Handle Errors**: Catch service errors and show user-friendly messages (Alert or inline error text)
5. **Use Theme**: Reference `Theme.colors`, `Theme.spacing`, `Theme.radius` for consistent styling
6. **Follow Routing**: Use Expo Router conventions; avoid imperative navigation when declarative `<Link>` works
7. **Test Both Providers**: Verify feature works with both Firebase and Supabase (toggle in AuthProvider dev)
8. **Keep Files Focused**: Split large components; aim for single responsibility per file
9. **Document Gaps**: Use `-- PENDING --` comments in services for unfinished functionality (follow existing pattern)
10. **Leverage Expo**: Use expo-native components (LinearGradient, etc.) when appropriate for platform consistency
