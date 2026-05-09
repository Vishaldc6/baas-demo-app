import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AddMembersModal } from "../../components/AddMembersModal";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";

import * as FirebaseProject from "../../services/firebase/project";

import * as SupabaseProject from "../../services/supabase/project";
import * as SupabaseProjectMembers from "../../services/supabase/project_members";
import * as SupabaseTask from "../../services/supabase/task";

const isOwner = true; // Static role flag as requested

const MOCK_MEMBERS = [
  { id: "1", name: "Alex Rivera", avatar: "https://i.pravatar.cc/150?u=alex" },
  { id: "2", name: "Sarah Chen", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { id: "3", name: "Mike Ross", avatar: "https://i.pravatar.cc/150?u=mike" },
];

const MOCK_TASKS = [
  { 
    id: "1", 
    title: "Review brand colors", 
    status: "Completed", 
    assignee: MOCK_MEMBERS[0],
    hasAttachment: true,
  },
  { 
    id: "2", 
    title: "Create logo variants", 
    status: "In Progress", 
    assignee: MOCK_MEMBERS[1],
    hasAttachment: false,
  },
  { 
    id: "3", 
    title: "Design homepage layout", 
    status: "To Do", 
    assignee: MOCK_MEMBERS[2],
    hasAttachment: true,
  },
  { 
    id: "4", 
    title: "Mobile responsive check", 
    status: "To Do", 
    assignee: MOCK_MEMBERS[0],
    hasAttachment: false,
  },
  { 
    id: "5", 
    title: "Feedback session with client", 
    status: "To Do", 
    assignee: MOCK_MEMBERS[1],
    hasAttachment: true,
  },
  { 
    id: "6", 
    title: "Finalize typography", 
    status: "To Do", 
    assignee: MOCK_MEMBERS[2],
    hasAttachment: false,
  },
];

export default function ProjectDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { provider } = useAuth();
  
  const [activeTab, setActiveTab] = useState("Tasks");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tasks, setTasks] = useState<any[]>(MOCK_TASKS);
  const [members, setMembers] = useState<any[]>(MOCK_MEMBERS);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (provider === "supabase") {
          // Fetch Tasks
          const fetchedTasks = await SupabaseTask.getTasksByProject(id as string);
          
          // Fetch Members
          const fetchedMembers = await SupabaseProjectMembers.getProjectMembers(
            id as string,
          );
          setTasks([...fetchedTasks, ...MOCK_TASKS]);
          setMembers([...fetchedMembers, ...MOCK_MEMBERS]);
        }
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, provider]);

  const handleAddMembers = async (members: any[]) => {
    try {
      if (provider === "firebase") {
        await FirebaseProject.addMembersToProject(id as string, members);
        Alert.alert("Success", "Members added successfully!");
        // Refresh project members here if pulling dynamically
      } else if (provider === "supabase") {
        await SupabaseProject.addMembersToProject(id as string, members);
        Alert.alert("Success", "Members added successfully!");
        // Refresh project members here if pulling dynamically
      } else {
        Alert.alert("Error", "No provider selected");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to add members");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "#10B981";
      case "In Progress": return "#3B82F6";
      default: return "#6B7280";
    }
  };

  const renderTaskItem = ({ item }: { item: typeof MOCK_TASKS[0] }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskMain}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.taskTitle,
            item.status === "Completed" && styles.completedTaskTitle
          ]}>
            {item.title}
          </Text>
          {item.hasAttachment && (
            <Feather name="paperclip" size={14} color={Theme.colors.textSecondary} style={styles.attachmentIcon} />
          )}
        </View>
        <View style={styles.taskMeta}>
          <Image source={{ uri: item.assignee.avatar }} style={styles.assigneeAvatar} />
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15" }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity>
        <Feather name="more-horizontal" size={20} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderMemberItem = ({ item }: { item: typeof MOCK_MEMBERS[0] }) => (
    <View style={styles.memberCard}>
      <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>Contributor</Text>
      </View>
      <TouchableOpacity style={styles.messageButton}>
        <Feather name="message-square" size={18} color={Theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Project Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="settings" size={22} color={Theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "Tasks" ? tasks : members}
        renderItem={activeTab === "Tasks" ? renderTaskItem : renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={() => (
          <View style={styles.projectInfo}>
            <View style={styles.projectNameRow}>
              <Text style={styles.projectName}>Project {id || "Details"}</Text>
              {isOwner && activeTab === "Members" && (
                <TouchableOpacity 
                  style={styles.addMemberButton}
                  onPress={() => setIsModalVisible(true)}
                >
                  <Feather name="user-plus" size={18} color={Theme.colors.primary} />
                  <Text style={styles.addMemberText}>Add Member</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.projectDesc}>
              This is a centralized hub for managing tasks, tracking progress, 
              and collaborating with team members on the current project.
            </Text>
            
            <View style={styles.tabRow}>
              {["Tasks", "Members"].map((tab) => (
                <TouchableOpacity 
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      {(isOwner || activeTab === "Tasks") && activeTab === "Tasks" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(`/task/create?projectId=${id}`)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="plus" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>Create Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <AddMembersModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddMembers={handleAddMembers}
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
  moreButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  },
  projectName: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  addMemberButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.md,
    backgroundColor: "#EFF6FF",
  },
  addMemberText: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.primary,
  },
  projectDesc: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
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
  attachmentIcon: {
    marginLeft: 8,
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
