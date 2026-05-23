import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { FirebaseTask } from "../../services/firebase";
import { SupabaseTask } from "../../services/supabase";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

const STATUS_COLORS: Record<string, string> = {
  todo: "#6B7280",
  in_progress: "#3B82F6",
  done: "#10B981",
  backlog: "#9CA3AF",
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

  useEffect(() => {
    fetchTasks();
  }, [provider, user]);

  const fetchTasks = async () => {
    if (!provider || !user?.id) return;
    setLoading(true);
    setError("");
    try {
      const data =
        provider === "firebase"
          ? await FirebaseTask.getTasksByAssignee(user.id)
          : await SupabaseTask.getTasksByAssignee(user.id);
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
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
      <TouchableOpacity style={styles.taskCard} activeOpacity={0.7}>
        <View style={styles.taskInfo}>
          <Text
            style={[
              styles.taskTitle,
              item.status === "done" && styles.completedTask,
            ]}
          >
            {item.title}
          </Text>
          {item.project_id && (
            <Text style={styles.projectId}>Project: {item.project_id.slice(0, 8)}...</Text>
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
          <Feather
            name="alert-circle"
            size={48}
            color={Theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTasks}>
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
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerSubtitle}>
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
