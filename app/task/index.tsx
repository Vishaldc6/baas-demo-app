import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";

const MOCK_TASKS = [
  {
    id: "1",
    title: "Finalize typography",
    project: "Brand Refresh",
    status: "To Do",
    dueDate: "Today",
  },
  {
    id: "2",
    title: "Mobile responsive check",
    project: "Brand Refresh",
    status: "In Progress",
    dueDate: "Tomorrow",
  },
  {
    id: "3",
    title: "Design homepage layout",
    project: "Marketing Website",
    status: "To Do",
    dueDate: "Apr 25",
  },
  {
    id: "4",
    title: "Update button variants",
    project: "Design System",
    status: "Completed",
    dueDate: "Apr 22",
  },
  {
    id: "5",
    title: "Client feedback review",
    project: "Marketing Website",
    status: "To Do",
    dueDate: "Apr 26",
  },
];

export default function MyTasks() {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "#10B981";
      case "In Progress": return "#3B82F6";
      default: return "#6B7280";
    }
  };

  const renderTaskItem = ({ item }: { item: typeof MOCK_TASKS[0] }) => (
    <TouchableOpacity style={styles.taskCard} activeOpacity={0.7}>
      <View style={styles.taskInfo}>
        <Text style={[
          styles.taskTitle,
          item.status === "Completed" && styles.completedTask
        ]}>
          {item.title}
        </Text>
        <Text style={styles.projectName}>{item.project}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={12} color={Theme.colors.textSecondary} />
            <Text style={styles.dateText}>{item.dueDate}</Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Tasks</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={MOCK_TASKS}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>
              You have {MOCK_TASKS.filter(t => t.status !== "Completed").length} tasks remaining
            </Text>
          </View>
        )}
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
  header: {
    padding: Theme.spacing.lg,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
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
  projectName: {
    fontSize: 14,
    color: Theme.colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
});
