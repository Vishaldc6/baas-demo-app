import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { TaskEditModal } from "../../components/TaskEditModal";
import { Theme } from "../../constants/Theme";
import { FirebaseTask } from "../../services/firebase";
import { SupabaseTask } from "../../services/supabase";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  todo: "#6B7280",
  in_progress: "#3B82F6",
  done: "#10B981",
  backlog: "#9CA3AF",
  in_review: "#F59E0B",
  cancelled: "#EF4444",
};

// TODO: Task detail/edit screen (task/[id].tsx)
// TODO: Task delete

export default function MyTasks() {
  const router = useRouter();
  const { provider, user } = useAuth();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<any | null>(
    null,
  );

  const [page, setPage] = useState(1);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleUpdateTask = async (
    taskId: string,
    updates: { status: string; assignee_id: string | null },
  ) => {
    try {
      if (provider === "firebase") {
        await FirebaseTask.updateTask(taskId, updates);
      } else if (provider === "supabase") {
        await SupabaseTask.updateTask(taskId, updates);
      }
      Alert.alert("Success", "Task updated successfully");
      fetchTasks();
    } catch (err: any) {
      console.error("Failed to update task:", err);
      Alert.alert("Error", err.message || "Failed to update task");
    }
  };

  const fetchTasks = useCallback(
    async (isLoadMore = false) => {
      if (!provider || !user?.id) return;

      if (isLoadMore && !hasMore) return;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
        setPage(1);
        setLastDocId(null);
        setHasMore(true);
      }

      try {
        const currentPage = isLoadMore
          ? provider === "supabase"
            ? page + 1
            : 1
          : 1;
        const currentCursor = isLoadMore
          ? provider === "firebase"
            ? lastDocId
            : null
          : null;

        let response: any;
        if (provider === "firebase") {
          response = await FirebaseTask.getTasksByAssignee(
            user.id,
            currentCursor,
            7,
          );
        } else {
          response = await SupabaseTask.getTasksByAssignee(
            user.id,
            currentPage,
            7,
          );
        }

        const newTasks = response.data || [];
        const newHasMore = response.hasMore || false;

        if (isLoadMore) {
          setTasks((prev) => [...prev, ...newTasks]);
          if (provider === "firebase") {
            setLastDocId(response.lastDoc);
          } else {
            setPage(currentPage);
          }
        } else {
          setTasks(newTasks);
          if (provider === "firebase") {
            setLastDocId(response.lastDoc);
          }
        }
        setHasMore(newHasMore);
      } catch (err: any) {
        setError(err.message || "Failed to load tasks");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [provider, user?.id, page, lastDocId, hasMore],
  );

  useFocusEffect(
    useCallback(() => {
      fetchTasks(false);
    }, [fetchTasks]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTasks(true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
      </View>
    );
  };

  const filteredTasks =
    activeFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === activeFilter);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      done: "Done",
      backlog: "Backlog",
      cancelled: "Cancelled",
    };
    return map[status] || status || "To Do";
  };

  const renderTaskItem = ({ item }: { item: any }) => {
    const statusColor = STATUS_COLORS[item.status] || "#6B7280";

    return (
      <TouchableOpacity
        style={styles.taskCard}
        activeOpacity={0.7}
        onPress={() => setSelectedTaskToEdit(item)}
      >
        <View style={styles.taskInfo}>
          <Text
            style={[
              styles.taskTitle,
              item.status === "done" && styles.completedTask,
            ]}
          >
            {item.title}
          </Text>
          {item.project_name && (
            <Text style={styles.projectId}>Project: {item.project_name}</Text>
          )}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "15" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
            {item.priority && item.priority !== "none" && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>{item.priority}</Text>
              </View>
            )}
          </View>
        </View>
        <Feather
          name="chevron-right"
          size={18}
          color={Theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={Theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTasks()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerSubtitle}>
                {hasMore ? "Loaded " : ""}
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} assigned
                {activeFilter !== "all" &&
                  ` · ${filteredTasks.length} ${getStatusLabel(activeFilter).toLowerCase()}`}
              </Text>
              <View style={styles.filterRow}>
                {STATUS_FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[
                      styles.filterChip,
                      activeFilter === f.key && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveFilter(f.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        activeFilter === f.key && styles.filterChipTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Feather
                name="check-square"
                size={48}
                color={Theme.colors.border}
              />
              <Text style={styles.emptyText}>
                {activeFilter === "all"
                  ? "No tasks assigned to you"
                  : `No tasks with status "${getStatusLabel(activeFilter)}"`}
              </Text>
            </View>
          )}
        />
      )}
      <TaskEditModal
        visible={!!selectedTaskToEdit}
        onClose={() => setSelectedTaskToEdit(null)}
        task={selectedTaskToEdit}
        onSave={handleUpdateTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  errorText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.error,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Theme.spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.sm,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
    marginBottom: Theme.spacing.md,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingBottom: 40,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 2,
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: Theme.colors.textSecondary,
  },
  projectId: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
    textTransform: "uppercase",
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: "center",
  },
});
