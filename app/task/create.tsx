import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";

import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";

import { SupabaseProjectMembers, SupabaseTask } from "../../services/supabase";

const MOCK_USERS = [
  { id: "1", name: "Alex Rivera" },
  { id: "2", name: "Sarah Chen" },
  { id: "3", name: "Mike Ross" },
];

export default function CreateTask() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const { user, provider } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedUser, setAssignedUser] = useState(MOCK_USERS[0]);
  const [projectMembers, setProjectMembers] = useState<any>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mockFile, setMockFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // PENDING
  // fetch project members for assignee dropdown
  const fetchProjectMembers = async () => {
    if (provider === "supabase" && user) {
      try {
        const members = await SupabaseProjectMembers.getProjectMembers(
          projectId as string,
        );
        setProjectMembers(members);
      } catch (error) {
        console.error("Failed to fetch project members:", error);
      }
    }
  };

  // PENDING
  // fetch project members for assignee dropdown
  React.useEffect(() => {
    fetchProjectMembers();
  }, []);

  
  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    if (!projectId) {
      Alert.alert("Error", "No project specified");
      return;
    }

    setLoading(true);
    try {
      if (provider === "supabase" && user) {
        await SupabaseTask.createTask({
          project_id: projectId as string,
          title,
          description,
          assignee_id: assignedUser?.id,
          created_by: (user as any).uid || (user as any).id,
          attachment: mockFile,
        });
        Alert.alert("Success", "Task created successfully");
        router.back();
      } else {
        Alert.alert("Error", "Provider not supported or user not logged in");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync();
    !result.canceled && setMockFile(result.assets[0]);
  };

  const handleRemoveFile = () => {
    setMockFile(null);
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
          <Text style={styles.label}>Assign User</Text>
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.selectorText}>{assignedUser.name}</Text>
            <Feather name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
          
          {showDropdown && (
            <View style={styles.dropdown}>
              {projectMembers.map((user) => (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.dropdownOption}
                  onPress={() => {
                    setAssignedUser(user);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    assignedUser.id === user.id && styles.activeDropdownOptionText
                  ]}>
                    {user.name}
                  </Text>
                  {assignedUser.id === user.id && (
                    <Feather name="check" size={16} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachments</Text>
          {!mockFile ? (
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
              <Feather name="upload-cloud" size={20} color={Theme.colors.primary} />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Feather name="file-text" size={20} color={Theme.colors.textSecondary} />
                <Text style={styles.fileName}>{mockFile.name}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveFile}>
                <Feather name="trash-2" size={20} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          activeOpacity={0.8}
          onPress={handleCreateTask}
          disabled={loading}
        >
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
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
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: "dashed",
    borderRadius: Theme.radius.md,
    backgroundColor: "#EFF6FF",
  },
  uploadButtonText: {
    color: Theme.colors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fileName: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: "500",
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
});
