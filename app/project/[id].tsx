import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AddMembersModal } from "../../components/AddMembersModal";
import { ProfileSheet } from "../../components/ProfileSheet";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { TaskEditModal } from "../../components/TaskEditModal";

import { FirebaseProject, FirebaseTask } from "../../services/firebase";
import {
  SupabaseProject,
  SupabaseProjectMembers,
  SupabaseTask,
} from "../../services/supabase";

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { provider, user } = useAuth();

  const [activeTab, setActiveTab] = useState("Tasks");
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [profileSheetUserId, setProfileSheetUserId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<any | null>(null);

  const [taskPage, setTaskPage] = useState(1);
  const [taskLastDocId, setTaskLastDocId] = useState<string | null>(null);
  const [tasksHasMore, setTasksHasMore] = useState(false);
  const [loadingMoreTasks, setLoadingMoreTasks] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!id || !provider || !user?.id) return;
    setLoading(true);
    try {
      const projectId = id as string;
      if (provider === "supabase") {
        const [projectData, taskRes, fetchedMembers, role] = await Promise.all([
          SupabaseProject.getProjectById(projectId),
          SupabaseTask.getTasksByProject(projectId, 1, 7),
          SupabaseProjectMembers.getProjectMembers(projectId),
          SupabaseProjectMembers.getCurrentUserRole(projectId, user.id),
        ]);
        setProject(projectData);
        setTasks(taskRes.data || []);
        setTasksHasMore(taskRes.hasMore || false);
        setTaskPage(1);
        setMembers(fetchedMembers || []);
        setIsOwner(role === "owner");
      }

      if (provider === "firebase") {
        const [projectData, taskRes, fetchedMembers, role] = await Promise.all([
          FirebaseProject.getProjectById(projectId),
          FirebaseTask.getTasksByProject(projectId, null, 7),
          FirebaseProject.getProjectMembers(projectId),
          FirebaseProject.getCurrentUserRole(projectId, user.id),
        ]);
        setProject(projectData);
        setTasks(taskRes.data || []);
        setTasksHasMore(taskRes.hasMore || false);
        setTaskLastDocId(taskRes.lastDoc);
        setMembers(fetchedMembers || []);
        setIsOwner(role === "owner");
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    } finally {
      setLoading(false);
    }
  }, [id, provider, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const loadMoreTasks = async () => {
    if (activeTab !== "Tasks" || loadingMoreTasks || !tasksHasMore || !id || !provider) return;
    setLoadingMoreTasks(true);
    try {
      const projectId = id as string;
      if (provider === "supabase") {
        const nextPage = taskPage + 1;
        const taskRes = await SupabaseTask.getTasksByProject(projectId, nextPage, 7);
        setTasks(prev => [...prev, ...(taskRes.data || [])]);
        setTasksHasMore(taskRes.hasMore || false);
        setTaskPage(nextPage);
      } else if (provider === "firebase") {
        const taskRes = await FirebaseTask.getTasksByProject(projectId, taskLastDocId, 7);
        setTasks(prev => [...prev, ...(taskRes.data || [])]);
        setTasksHasMore(taskRes.hasMore || false);
        setTaskLastDocId(taskRes.lastDoc);
      }
    } catch (error) {
      console.error("Failed to load more tasks:", error);
    } finally {
      setLoadingMoreTasks(false);
    }
  };

  const renderTasksFooter = () => {
    if (activeTab === "Tasks" && loadingMoreTasks) {
      return (
        <View style={{ paddingVertical: 20, alignItems: "center" }}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        </View>
      );
    }
    return null;
  };

  const handleDeleteProject = () => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project? This will permanently delete all tasks, members, and messages associated with it. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              if (provider === "firebase") {
                await FirebaseProject.deleteProject(id as string);
              } else if (provider === "supabase") {
                await SupabaseProject.deleteProject(id as string);
              }
              Alert.alert("Success", "Project deleted successfully");
              router.replace("/(tabs)/home");
            } catch (error: any) {
              console.error("Failed to delete project:", error);
              Alert.alert("Error", error.message || "Failed to delete project");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName} from this project?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              if (provider === "firebase") {
                await FirebaseProject.removeMemberFromProject(id as string, memberId);
              } else if (provider === "supabase") {
                await SupabaseProjectMembers.removeMemberFromProject(id as string, memberId);
              }
              Alert.alert("Success", "Member removed successfully");
              loadData();
            } catch (error: any) {
              console.error("Failed to remove member:", error);
              Alert.alert("Error", error.message || "Failed to remove member");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const membersMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of members) {
      map[m.id] = m;
    }
    return map;
  }, [members]);

  const handleAddMembers = async (newMembers: any[]) => {
    try {
      if (provider === "firebase") {
        await FirebaseProject.addMembersToProject(id as string, newMembers);
      } else if (provider === "supabase") {
        await SupabaseProject.addMembersToProject(id as string, newMembers);
      }
      Alert.alert("Success", "Members added successfully!");
      loadData();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to add members");
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status?.toLowerCase() || "todo";
    switch (normalized) {
      case "completed":
      case "done":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
      case "in_review":
        return "#F59E0B";
      case "backlog":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      todo: "To Do",
      in_progress: "In Progress",
      in_review: "In Review",
      done: "Done",
      backlog: "Backlog",
      cancelled: "Cancelled",
    };
    const normalized = status?.toLowerCase() || "todo";
    return map[normalized] || status || "To Do";
  };

  const handleUpdateTask = async (taskId: string, updates: { status: string; assignee_id: string | null }) => {
    try {
      if (provider === "firebase") {
        await FirebaseTask.updateTask(taskId, updates);
      } else if (provider === "supabase") {
        await SupabaseTask.updateTask(taskId, updates);
      }
      Alert.alert("Success", "Task updated successfully");
      loadData();
    } catch (error: any) {
      console.error("Failed to update task:", error);
      Alert.alert("Error", error.message || "Failed to update task");
    }
  };

  const getAssigneeName = (assigneeId: string) => {
    const member = membersMap[assigneeId];
    return member?.name || assigneeId || "U";
  };

  const renderTaskItem = ({ item }: { item: any }) => {
    const assigneeName = getAssigneeName(item.assignee_id);
    const isCompleted = item.status === "Completed" || item.status?.toLowerCase() === "done";
    return (
      <TouchableOpacity
        style={styles.taskCard}
        activeOpacity={0.7}
        onPress={() => setSelectedTaskToEdit(item)}
      >
        <View style={styles.taskMain}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.taskTitle,
                isCompleted && styles.completedTaskTitle,
              ]}
            >
              {item.title}
            </Text>
          </View>
          <View style={styles.taskMeta}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${assigneeName}&background=2563EB&color=fff&size=24` }}
              style={styles.assigneeAvatar}
            />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "15" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        </View>
        <Feather name="more-horizontal" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderMemberItem = ({ item }: { item: any }) => (
    <View style={styles.memberCard}>
      {/* TODO: Implement role update / member removal UI triggers here if needed in future.
          Example: If isOwner is true, tapping a member card could show an Alert/ActionSheet
          to "Change Role (Owner/Member)" or "Remove Member from Project".
      */}
      <Image
        source={{
          uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "U")}&background=2563EB&color=fff&size=96`,
        }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>
      {/* TODO: Implement leave project UI trigger if needed in future.
          Example: Tapping own user card could show "Leave Project" confirmation dialog.
      */}
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => setProfileSheetUserId(item.id)}
        >
          <Feather name="user" size={18} color={Theme.colors.primary} />
        </TouchableOpacity>
        {isOwner && item.id !== user?.id && (
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: "#FEE2E2", marginLeft: 8 }]}
            onPress={() => handleRemoveMember(item.id, item.name)}
          >
            <Feather name="trash-2" size={18} color={Theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Project Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push(`/chat/${id}`)}
          >
            <Feather name="message-circle" size={22} color={Theme.colors.primary} />
          </TouchableOpacity>
          {isOwner && (
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDeleteProject}
            >
              <Feather name="trash-2" size={22} color={Theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        /* TODO: When member/status filter is active, replace `tasks` with a filtered copy (useMemo) derived from raw `tasks`. Do not refetch from API. */
        <FlatList
          data={activeTab === "Tasks" ? tasks : members}
          renderItem={activeTab === "Tasks" ? renderTaskItem : renderMemberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          onEndReached={activeTab === "Tasks" ? loadMoreTasks : undefined}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderTasksFooter}
          ListHeaderComponent={() => (
            <View style={styles.projectInfo}>
              <View style={styles.projectNameRow}>
                <Text style={styles.projectName}>{project?.name || `Project ${id}`}</Text>
              </View>
              <Text style={styles.projectDesc}>
                {project?.description || "No description"}
              </Text>

              <View style={styles.statsRow}>
                {project && (
                  <>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{members.length}</Text>
                      <Text style={styles.statLabel}>Members</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{tasks.length}</Text>
                      <Text style={styles.statLabel}>Tasks</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.tabRow}>
                {["Tasks", "Members"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab && styles.activeTabText,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* TODO: Add filter row below tasks tab — chips for "All Tasks" / "My Tasks" (filter by current user's member id) + status filter (All / To Do / In Progress / Done). Filter should re-render FlatList data without extra API call. */}
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === "Tasks" ? "No tasks yet" : "No members"}
              </Text>
            </View>
          )}
        />
      )}

      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            activeTab === "Tasks"
              ? router.push(`/task/create?projectId=${id}`)
              : setIsAddMemberModalVisible(true)
          }
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather
              name={activeTab === "Tasks" ? "plus" : "user-plus"}
              size={24}
              color={"#FFFFFF"}
            />
            <Text style={styles.fabText}>
              {activeTab === "Tasks" ? "Create Task" : "Add Member"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <AddMembersModal
        visible={isAddMemberModalVisible}
        onClose={() => setIsAddMemberModalVisible(false)}
        onAddMembers={handleAddMembers}
      />

      <ProfileSheet
        visible={!!profileSheetUserId}
        userId={profileSheetUserId || ""}
        onClose={() => setProfileSheetUserId(null)}
      />

      <TaskEditModal
        visible={!!selectedTaskToEdit}
        onClose={() => setSelectedTaskToEdit(null)}
        task={selectedTaskToEdit}
        projectMembers={members}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 120,
  },
  projectInfo: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  projectNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: Theme.spacing.lg,
  },
  projectName: {
    flex: 1,
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  projectDesc: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tabRow: {
    flexDirection: "row",
    gap: Theme.spacing.xl,
  },
  tab: {
    paddingBottom: Theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  activeTabText: {
    color: Theme.colors.primary,
  },
  taskCard: {
    flexDirection: "row",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskMain: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  completedTaskTitle: {
    textDecorationLine: "line-through",
    color: Theme.colors.textSecondary,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
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
  memberCard: {
    flexDirection: "row",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: "center",
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  memberRole: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fabText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
