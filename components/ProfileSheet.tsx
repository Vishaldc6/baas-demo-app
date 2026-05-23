import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../constants/Theme";
import { useAuth } from "./AuthProvider";
import { FirebaseProfile } from "../services/firebase";
import { SupabaseProfile } from "../services/supabase";

interface ProfileSheetProps {
  visible: boolean;
  userId: string;
  onClose: () => void;
}

export function ProfileSheet({ visible, userId, onClose }: ProfileSheetProps) {
  const { provider } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId || !provider) return;
    fetchProfile();
  }, [visible, userId, provider]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data =
        provider === "firebase"
          ? await FirebaseProfile.getProfile(userId)
          : await SupabaseProfile.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const avatarUri =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || "U")}&background=2563EB&color=fff&size=200`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {loading ? (
            <ActivityIndicator
              style={styles.loader}
              color={Theme.colors.primary}
            />
          ) : profile ? (
            <View style={styles.content}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <Text style={styles.username}>{profile.username}</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Feather name="x" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              <Feather
                name="user-x"
                size={48}
                color={Theme.colors.border}
              />
              <Text style={styles.errorText}>User not found</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Feather name="x" size={20} color={Theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
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
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    paddingBottom: 40,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.border,
    marginTop: 12,
    marginBottom: 24,
  },
  loader: {
    paddingVertical: 60,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: Theme.spacing.xl,
    width: "100%",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Theme.colors.surface,
    marginBottom: Theme.spacing.md,
  },
  username: {
    fontSize: 20,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  closeBtn: {
    position: "absolute",
    top: -8,
    right: Theme.spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
});
