import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { AddMembersModal } from "../../components/AddMembersModal";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import * as FirebaseProject from "../../services/firebase/project";
import * as SupabaseProject from "../../services/supabase/project";

export default function CreateProject() {
  const router = useRouter();
  const { user, provider } = useAuth();
  console.log({ user });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [color, setColor] = useState("#3B82F6");

  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Project name is required.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create a project.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (provider === "firebase") {
        const projectId = await FirebaseProject.createProject(
          (user as any).id, // depending on user object shape
          { name, description, icon, color },
          selectedMembers,
        );
        console.log("Created project id: ", projectId);

        router.replace(`/(tabs)/home`);
      } else if (provider === "supabase") {
        const projectId = await SupabaseProject.createProject(
          (user as any).id, // Supabase user has .id
          { name, description, icon, color },
          selectedMembers,
        );
        console.log("Created supabase project id: ", projectId);

        router.replace(`/(tabs)/home`);
      } else {
        Alert.alert("Error", "No provider selected");
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.message || "Failed to create project");
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Project</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Icon</Text>
          <TextInput
            style={[styles.input, styles.iconInput]}
            value={icon}
            onChangeText={(text) => {
              // keep only the last character or emoji
              setIcon(text.slice(-2));
            }}
            placeholder="🚀"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Brand Refresh"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What is this project about?"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Color</Text>
          <View style={styles.colorGrid}>
            {[
              "#3B82F6",
              "#8B5CF6",
              "#10B981",
              "#F59E0B",
              "#EF4444",
              "#EC4899",
            ].map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorOption,
                  { backgroundColor: c },
                  color === c && styles.colorOptionSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Team Members</Text>
          <View style={styles.membersList}>
            {selectedMembers.map((m) => (
              <View key={m.id} style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {m.username?.charAt(0).toUpperCase()}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addMemberBtn}
              onPress={() => setIsModalVisible(true)}
            >
              <Feather name="plus" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleSubmit}
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
              <Text style={styles.submitText}>Create Project</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <AddMembersModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddMembers={(members) => {
          // Merge avoiding duplicates
          setSelectedMembers((prev) => {
            const newMembers = members.filter(
              (m) => !prev.some((p) => p.id === m.id),
            );
            return [...prev, ...newMembers];
          });
        }}
      />
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
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: Theme.colors.text,
  },
  membersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  addMemberBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
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
  iconInput: {
    width: 60,
    textAlign: "center",
    fontSize: 24,
  },
});
