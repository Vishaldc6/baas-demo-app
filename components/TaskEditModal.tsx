import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Theme } from "../constants/Theme";
import { useAuth } from "./AuthProvider";
import { FirebaseProject } from "../services/firebase";
import { SupabaseProjectMembers } from "../services/supabase";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee_id?: string | null;
}

interface TaskEditModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  projectMembers?: Member[];
  onSave: (taskId: string, updates: { status: string; assignee_id: string | null }) => Promise<void>;
}

const STATUSES = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

export function TaskEditModal({
  visible,
  onClose,
  task,
  projectMembers = [],
  onSave,
}: TaskEditModalProps) {
  const { provider } = useAuth();
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>(projectMembers);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(task.status?.toLowerCase() || "todo");
      setAssigneeId(task.assignee_id || null);
      
      // If we already have members, use them. Otherwise fetch dynamically.
      if (projectMembers && projectMembers.length > 0) {
        setMembers(projectMembers);
      } else if (task.project_id) {
        fetchMembers(task.project_id);
      }
    }
    setShowStatusDropdown(false);
    setShowAssigneeDropdown(false);
  }, [task, projectMembers]);

  const fetchMembers = async (projectId: string) => {
    setLoadingMembers(true);
    try {
      let fetched: Member[] = [];
      if (provider === "supabase") {
        fetched = await SupabaseProjectMembers.getProjectMembers(projectId);
      } else if (provider === "firebase") {
        fetched = await FirebaseProject.getProjectMembers(projectId);
      }
      setMembers(fetched || []);
    } catch (error) {
      console.error("Failed to fetch project members in edit modal:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await onSave(task.id, { status, assignee_id: assigneeId });
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  if (!task) return null;

  const currentAssignee = members.find((m) => m.id === assigneeId);
  const currentStatusLabel = STATUSES.find((s) => s.key === status)?.label || status;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Task Info */}
            <View style={styles.taskInfoSection}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.description ? (
                <Text style={styles.taskDesc}>{task.description}</Text>
              ) : (
                <Text style={styles.noDesc}>No description provided</Text>
              )}
            </View>

            {/* Status Selector */}
            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowAssigneeDropdown(false);
                }}
              >
                <Text style={styles.selectorText}>{currentStatusLabel}</Text>
                <Feather
                  name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showStatusDropdown && (
                <View style={styles.dropdown}>
                  {STATUSES.map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setStatus(s.key);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          status === s.key && styles.activeOptionText,
                        ]}
                      >
                        {s.label}
                      </Text>
                      {status === s.key && (
                        <Feather name="check" size={16} color={Theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Assignee Selector */}
            <View style={styles.selectorGroup}>
              <Text style={styles.label}>Assignee</Text>
              {loadingMembers ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} style={styles.loader} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => {
                      setShowAssigneeDropdown(!showAssigneeDropdown);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <View style={styles.selectedAssigneeRow}>
                      {currentAssignee ? (
                        <>
                          <Image
                            source={{
                              uri: currentAssignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentAssignee.name)}&background=2563EB&color=fff&size=40`,
                            }}
                            style={styles.selectorAvatar}
                          />
                          <Text style={styles.selectorText}>{currentAssignee.name}</Text>
                        </>
                      ) : (
                        <Text style={[styles.selectorText, styles.placeholderText]}>Unassigned</Text>
                      )}
                    </View>
                    <Feather
                      name={showAssigneeDropdown ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={Theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {showAssigneeDropdown && (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        style={styles.dropdownOption}
                        onPress={() => {
                          setAssigneeId(null);
                          setShowAssigneeDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownOptionText}>Unassigned</Text>
                        {!assigneeId && (
                          <Feather name="check" size={16} color={Theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                      {members.map((member) => (
                        <TouchableOpacity
                          key={member.id}
                          style={styles.dropdownOption}
                          onPress={() => {
                            setAssigneeId(member.id);
                            setShowAssigneeDropdown(false);
                          }}
                        >
                          <View style={styles.assigneeOptionRow}>
                            <Image
                              source={{
                                uri: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563EB&color=fff&size=40`,
                              }}
                              style={styles.optionAvatar}
                            />
                            <Text
                              style={[
                                styles.dropdownOptionText,
                                assigneeId === member.id && styles.activeOptionText,
                              ]}
                            >
                              {member.name}
                            </Text>
                          </View>
                          {assigneeId === member.id && (
                            <Feather name="check" size={16} color={Theme.colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    maxHeight: "85%",
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingBottom: Theme.spacing.xl,
  },
  taskInfoSection: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 6,
  },
  taskDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  noDesc: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontStyle: "italic",
  },
  selectorGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectedAssigneeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectorText: {
    fontSize: 16,
    color: Theme.colors.text,
  },
  placeholderText: {
    color: Theme.colors.textSecondary,
  },
  loader: {
    paddingVertical: Theme.spacing.md,
  },
  dropdown: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: Theme.colors.text,
  },
  activeOptionText: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  assigneeOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    height: 50,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
