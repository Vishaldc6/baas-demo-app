import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { FirebaseChat } from "../../services/firebase";
import { SupabaseChat } from "../../services/supabase";

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ChatList() {
  const router = useRouter();
  const { provider, user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    if (!user?.id || !provider) return;
    try {
      setError(null);
      let data: any[] = [];
      if (provider === "firebase") {
        data = await FirebaseChat.getUserProjectsWithLatestMessage(user.id);
      } else if (provider === "supabase") {
        data = await SupabaseChat.getUserProjectsWithLatestMessage(user.id);
      }
      // Only show projects that have at least one message (active rooms)
      const activeChats = (data || []).filter((chat: any) => chat.latestMessage !== null);
      setChats(activeChats);
    } catch (err: any) {
      console.error("Failed to load chats:", err);
      setError(err.message || "Failed to load chats");
    }
  }, [user?.id, provider]);

  React.useEffect(() => {
    setLoading(true);
    loadChats().finally(() => setLoading(false));
  }, [loadChats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  }, [loadChats]);

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.chatItem}
      activeOpacity={0.6}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image
        source={{
          uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "P")}&background=2563EB&color=fff&size=104`,
        }}
        style={styles.avatar}
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.latestMessage && (
            <Text style={styles.time}>{formatTime(item.latestMessage.createdAt)}</Text>
          )}
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.latestMessage
              ? `${item.latestMessage.senderName ? item.latestMessage.senderName + ": " : ""}${item.latestMessage.text}`
              : "No messages yet"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={Theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadChats}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={chats.length === 0 ? styles.emptyListContent : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color={Theme.colors.textSecondary} />
              <Text style={styles.searchPlaceholder}>Search messages...</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="message-square" size={48} color={Theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>Your project conversations will appear here</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    padding: Theme.spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchPlaceholder: {
    marginLeft: Theme.spacing.sm,
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  chatItem: {
    flexDirection: "row",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: Theme.spacing.md,
    backgroundColor: "#F3F4F6",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  time: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Theme.spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
