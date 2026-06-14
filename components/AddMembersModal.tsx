import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../constants/Theme";
import { useAuth } from "./AuthProvider";

import { FirebaseProject } from "../services/firebase";
import { SupabaseProject } from "../services/supabase";

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  email?: string;
}

interface AddMembersModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMembers: (members: UserProfile[]) => void;
}

export function AddMembersModal({
  visible,
  onClose,
  onAddMembers,
}: AddMembersModalProps) {
  const { provider, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get user id depending on provider payload
  const currentUserId = (user as any)?.id;

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        let results: UserProfile[] = [];
        if (provider === "firebase") {
          results = await FirebaseProject.searchUsersByKeyword(
            searchQuery.trim(),
            currentUserId,
          );
        } else if (provider === "supabase") {
          results = await SupabaseProject.searchUsersByKeyword(
            searchQuery.trim(),
            currentUserId,
          );
        }
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, provider]);

  const toggleMemberSelection = (user: UserProfile) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.find((m) => m.id === user.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleAdd = () => {
    onAddMembers(selectedMembers);
    setSelectedMembers([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedMembers([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Members</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather
              name="search"
              size={20}
              color={Theme.colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={Theme.colors.textSecondary}
            />
          </View>

          {/* Results List */}
          {isLoading ? (
            <ActivityIndicator
              style={styles.loader}
              color={Theme.colors.primary}
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                searchQuery.trim() ? (
                  <Text style={styles.emptyText}>No users found</Text>
                ) : (
                  <Text style={styles.emptyText}>Type to search users</Text>
                )
              }
              renderItem={({ item }) => {
                const isSelected = selectedMembers.some(
                  (m) => m.id === item.id,
                );
                return (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => toggleMemberSelection(item)}
                  >
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {item.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.username}>{item.username}</Text>
                        <Text style={styles.emailText}>{item.email}</Text>                        
                      </View>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={14} color="#FFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                selectedMembers.length === 0 && styles.addButtonDisabled,
              ]}
              disabled={selectedMembers.length === 0}
              onPress={handleAdd}
            >
              <Text style={styles.addButtonText}>
                Add {selectedMembers.length > 0 ? selectedMembers.length : ""}{" "}
                Member{selectedMembers.length !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    height: "80%",
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  closeBtn: {
    padding: Theme.spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 50,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.text,
  },
  loader: {
    marginTop: Theme.spacing.xl,
  },
  listContent: {
    paddingBottom: Theme.spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xl,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Theme.spacing.md,
  },
  avatarText: {
    color: Theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  username: {
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: "500",
  },
  emailText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  footer: {
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    borderRadius: Theme.radius.lg,
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: Theme.colors.border,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
