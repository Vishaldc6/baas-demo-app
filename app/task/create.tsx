import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { FirebaseProject, FirebaseTask } from "../../services/firebase";
import { SupabaseProjectMembers, SupabaseTask } from "../../services/supabase";

// TODO: Task detail/edit screen (task/[id].tsx)
// TODO: Task delete
// TODO: Task reorder

export default function CreateTask() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const { user, provider } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUser, setAssignedUser] = useState<any>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [attachment, setAttachment] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        });
      }
    } catch (error) {
      console.error("Failed to pick document:", error);
      Alert.alert("Error", "Failed to select document");
    }
  };

  useEffect(() => {
    fetchProjectMembers();
  }, []);

  const fetchProjectMembers = async () => {
    if (!projectId || !provider || !user?.id) return;
    setLoading(true);
    try {
      let members: any[] = [];
      if (provider === "supabase") {
        members = await SupabaseProjectMembers.getProjectMembers(projectId as string);
      } else if (provider === "firebase") {
        members = await FirebaseProject.getProjectMembers(projectId as string);
      }
      setProjectMembers(members || []);
    } catch (error) {
      console.error("Failed to fetch project members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    if (!projectId) {
      Alert.alert("Error", "No project specified");
      return;
    }

    setIsSubmitting(true);
    try {
      const taskPayload = {
        project_id: projectId as string,
        title: title.trim(),
        description: description.trim(),
        assignee_id: assignedUser?.id || null,
        created_by: user?.id || "",
        attachment: attachment || null,
      };

      if (provider === "supabase") {
        await SupabaseTask.createTask(taskPayload);
      } else if (provider === "firebase") {
        await FirebaseTask.createTask(taskPayload);
      } else {
        Alert.alert("Error", "No provider selected");
        return;
      }

      Alert.alert("Success", "Task created successfully");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Task</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            placeholder="What needs to be done?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add more details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Assign To</Text>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={Theme.colors.primary}
              style={styles.loader}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowDropdown(!showDropdown)}
              >
                <Text
                  style={[
                    styles.selectorText,
                    !assignedUser && styles.selectorPlaceholder,
                  ]}
                >
                  {assignedUser ? assignedUser.name : "Select a member"}
                </Text>
                <Feather
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {showDropdown && (
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownOption}
                    onPress={() => {
                      setAssignedUser(null);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>Unassigned</Text>
                    {!assignedUser && (
                      <Feather name="check" size={16} color={Theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                  {projectMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setAssignedUser(member);
                        setShowDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          assignedUser?.id === member.id && styles.activeDropdownOptionText,
                        ]}
                      >
                        {member.name}
                      </Text>
                      {assignedUser?.id === member.id && (
                        <Feather name="check" size={16} color={Theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachment</Text>
          {attachment ? (
            <View style={styles.attachmentContainer}>
              <View style={styles.attachmentDetails}>
                <Feather name="file" size={20} color={Theme.colors.primary} />
                <View style={styles.attachmentTextContainer}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {attachment.name}
                  </Text>
                  <Text style={styles.attachmentSize}>
                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Unknown Size"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setAttachment(null)}
                style={styles.removeAttachmentButton}
              >
                <Feather name="trash-2" size={18} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.attachmentSelector}
              onPress={handlePickDocument}
            >
              <Feather name="paperclip" size={20} color={Theme.colors.textSecondary} />
              <Text style={styles.attachmentSelectorText}>Attach a document</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleCreateTask}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Create Task</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  closeButton: {
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
  content: {
    padding: Theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.text,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  loader: {
    paddingVertical: Theme.spacing.md,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  selectorText: {
    fontSize: 15,
    color: Theme.colors.text,
  },
  selectorPlaceholder: {
    color: Theme.colors.textSecondary,
  },
  dropdown: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.md,
    marginTop: 4,
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
  activeDropdownOptionText: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  submitButton: {
    marginTop: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    overflow: "hidden",
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  attachmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  attachmentDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  attachmentTextContainer: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: "600",
  },
  attachmentSize: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  removeAttachmentButton: {
    padding: 8,
  },
  attachmentSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.textSecondary,
    gap: 8,
  },
  attachmentSelectorText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
  },
});
