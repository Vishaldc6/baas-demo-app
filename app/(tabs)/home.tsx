import { useAuth } from "@/components/AuthProvider";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { FirebaseProject } from "../../services/firebase";
import { SupabaseProject } from "../../services/supabase";

export default function Home() {
  const router = useRouter();
  const { provider, user } = useAuth();

  const [projectList, setProjectList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllProjects();
  }, []);

  async function fetchAllProjects() {
    if (!provider || !user?.id) return;
    try {
      const data =
        provider === "firebase"
          ? await FirebaseProject.getProjectList(user.id)
          : await SupabaseProject.getProjectList(user.id);
      setProjectList(data || []);
    } catch (error) {
      console.log({ error });
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllProjects();
    setRefreshing(false);
  };

  // TODO: Edit project (name, description, color, icon)
  // TODO: Archive / unarchive project
  // TODO: Delete project
  // TODO: Invitation flow (email token, expiry, accept/decline)
  // TODO: Activity log (timeline of actions)
  // TODO: Project member operations (change role, remove, leave)

  const renderProjectCard = ({ item }: { item: any }) => {
    const maxAvatars = 3;
    const displayMembers = item.members?.slice(0, maxAvatars) || [];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/project/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: item.color || Theme.colors.primary }]} />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description || "No description"}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.memberContainer}>
            <View style={styles.avatarStack}>
              {displayMembers.map((m: any, i: number) => (
                <Image
                  key={m.id || m.user_id || i}
                  source={{
                    uri: m.avatar || `https://ui-avatars.com/api/?name=${m.name || "U"}&background=2563EB&color=fff&size=20`,
                  }}
                  style={[
                    styles.miniAvatar,
                    { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i },
                  ]}
                />
              ))}
              {(item.members?.length || 0) > maxAvatars && (
                <View style={[styles.miniAvatar, styles.miniAvatarMore, { marginLeft: -8 }]}>
                  <Text style={styles.miniAvatarMoreText}>+{item.members.length - maxAvatars}</Text>
                </View>
              )}
            </View>
            <Text style={styles.memberText}>{item.members?.length || 0} members</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.taskCount}>{item.taskCount || 0} tasks</Text>
            <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projectList}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Projects</Text>
            <Text style={styles.headerSubtitle}>
              You have {projectList.length} active project{projectList.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="folder" size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first project</Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/project/create")}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={Theme.colors.primaryGradient}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="plus" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: Theme.spacing.xl,
    marginTop: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
    paddingTop: 12,
  },
  memberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    marginRight: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.surface,
    backgroundColor: "#E5E7EB",
  },
  miniAvatarMore: {
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarMoreText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  memberText: {
    fontSize: 13,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskCount: {
    fontSize: 13,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
