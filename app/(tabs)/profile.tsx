import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { FirebaseProfile, FirebaseProject, FirebaseTask } from "../../services/firebase";
import { SupabaseProfile, SupabaseProject, SupabaseTask } from "../../services/supabase";

export default function Profile() {
  const { user, signOut, refreshProfile, provider } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false);

  // Edit form state — initialised from context user
  const [username, setUsername] = useState(user?.username ?? "");
  console.log({ user });

  const avatarUri = user?.avatar_url
    ? `${user.avatar_url}?t=${user.updated_at ? new Date(user.updated_at).getTime() : Date.now()}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.username || "U",
      )}&background=2563EB&color=fff&size=200`;

  const handlePickAvatar = async () => {
    if (!provider || !user?.id) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to change your avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;
    
    const pickedUri = result.assets[0].uri;

    try {
      setIsUploading(true);
      if (provider === "supabase") {
        await SupabaseProfile.uploadAvatar(user.id, pickedUri);
      } else if (provider === "firebase") {
        await FirebaseProfile.uploadAvatar(user.id, pickedUri);
      }
      await refreshProfile();
    } catch (err: any) {
      console.log({ err });

      Alert.alert("Upload failed", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save profile edits ─────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id || !provider) return;

    if (!username.trim()) {
      Alert.alert("Validation", "Username cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      if (provider === "supabase") {
        await SupabaseProfile.updateProfile(user.id, {
          username: username.trim(),
        });
      } else if (provider === "firebase") {
        await FirebaseProfile.updateProfile(user.id, {
          username: username.trim(),
        });
      }
      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert("Update failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current profile values
    setUsername(user?.username ?? "");
    setIsEditing(false);
  };

  const handleCreateDummyRecords = async () => {
    if (!user?.id || !provider) return;

    Alert.alert(
      "Generate Dummy Records",
      "This will create 3 demo projects, each with 5 tasks. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            setIsGeneratingDummy(true);
            try {
              const projectDataTemplates = [
                {
                  name: "Alpha Launch Campaign",
                  description: "Marketing and strategy launch plan for Project Alpha.",
                  color: "#3B82F6",
                  icon: "activity",
                },
                {
                  name: "Mobile App Beta Test",
                  description: "Usability testing, feedback gathering, and bug triaging.",
                  color: "#10B981",
                  icon: "smartphone",
                },
                {
                  name: "Brand Design Refresh",
                  description: "Updating assets, style guidelines, and logo presentations.",
                  color: "#F59E0B",
                  icon: "edit-3",
                },
              ];

              const taskTemplates = [
                { title: "Define roadmap and milestones", description: "Establish high-level timelines and deliverables." },
                { title: "Draft marketing brief", description: "Detail key audiences, messaging, and channels." },
                { title: "Review competitor pricing models", description: "Collect data on top 3 competitors." },
                { title: "Coordinate launch logistics", description: "Organize calendars, invitees, and deck slides." },
                { title: "Prepare release notes", description: "List new features and resolved issues." },
              ];

              for (let i = 0; i < projectDataTemplates.length; i++) {
                const projTemplate = projectDataTemplates[i];
                let projectId = "";

                if (provider === "firebase") {
                  projectId = await FirebaseProject.createProject(user.id, {
                    name: projTemplate.name,
                    description: projTemplate.description,
                    color: projTemplate.color,
                    icon: projTemplate.icon,
                  });
                } else {
                  projectId = await SupabaseProject.createProject(user.id, {
                    name: projTemplate.name,
                    description: projTemplate.description,
                    color: projTemplate.color,
                    icon: projTemplate.icon,
                  });
                }

                // Create 5 tasks for this project
                for (let j = 0; j < taskTemplates.length; j++) {
                  const taskTemplate = taskTemplates[j];
                  const taskPayload = {
                    project_id: projectId,
                    title: taskTemplate.title,
                    description: taskTemplate.description,
                    assignee_id: null,
                    created_by: user.id,
                  };

                  if (provider === "firebase") {
                    await FirebaseTask.createTask(taskPayload);
                  } else {
                    await SupabaseTask.createTask(taskPayload);
                  }
                }
              }

              Alert.alert("Success", "Dummy projects and tasks successfully created!");
            } catch (err: any) {
              console.error("Failed to generate dummy records:", err);
              Alert.alert("Error", err.message || "Failed to generate dummy records.");
            } finally {
              setIsGeneratingDummy(false);
            }
          },
        },
      ]
    );
  };

  // ── Helper: settings option row ────────────────────────────────
  const renderOption = (
    icon: any,
    label: string,
    onPress?: () => void,
    color = Theme.colors.text,
  ) => (
    <TouchableOpacity
      style={styles.option}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + "10" }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={Theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          onPress={isEditing ? handlePickAvatar : undefined}
          activeOpacity={0.8}
          style={styles.avatarWrapper}
        >
          <Image source={{ uri: avatarUri }} style={styles.profileImage} />
          {isEditing && (
            <View style={styles.cameraBadge}>
              {isUploading ? (
                <ActivityIndicator size={12} color="#fff" />
              ) : (
                <Feather name="camera" size={14} color="#fff" />
              )}
            </View>
          )}
        </TouchableOpacity>

        {!isEditing ? (
          <>
            <Text style={styles.profileName}>
              {user?.username || "New User"}
            </Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
          </>
        ) : null}
      </View>

      {isEditing ? (
        <View style={styles.editSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor={Theme.colors.textSecondary}
              autoCapitalize="none"
              editable={!isSaving}
            />
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelEdit}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Action cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              {renderOption("edit-3", "Edit Profile", () => setIsEditing(true))}
              {/* {renderOption("bell", "Notifications", () => router.push("/notifications"))} */}
            </View>
          </View>

          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.card}>
              {renderOption("clock", "Recent Activity")}
            </View>
          </View> */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demo Tools</Text>
            <View style={styles.card}>
              {isGeneratingDummy ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color={Theme.colors.primary} />
                  <Text style={styles.loaderText}>Generating Demo Data...</Text>
                </View>
              ) : (
                renderOption(
                  "database",
                  "Generate Dummy Records",
                  handleCreateDummyRecords,
                  Theme.colors.primary
                )
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={20} color={Theme.colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: 60,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Theme.spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Theme.colors.surface,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Theme.colors.surface,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 2,
  },
  profileUsername: {
    fontSize: 15,
    color: Theme.colors.primary,
    fontWeight: "600",
    marginBottom: 6,
  },
  profileBio: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 260,
  },

  // ── Edit form ───────────────────────────
  editSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Theme.colors.text,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: Theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Theme.radius.sm,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Options / Cards ─────────────────────
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },

  // ── Sign Out ────────────────────────────
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + "20",
  },
  signOutText: {
    marginLeft: Theme.spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.error,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  loaderText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
  },
});
