import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Theme } from "../../constants/Theme";

const MOCK_CHATS = [
  {
    id: "1",
    name: "Alex Rivera",
    lastMessage: "I've uploaded the latest design files for review.",
    time: "2m ago",
    unread: 2,
    avatar: "https://i.pravatar.cc/150?u=alex",
  },
  {
    id: "2",
    name: "Project Alpha Team",
    lastMessage: "Sarah: Let's sync on the marketing strategy tomorrow.",
    time: "15m ago",
    unread: 0,
    avatar: "https://i.pravatar.cc/150?u=alpha",
  },
  {
    id: "3",
    name: "Jordan Smith",
    lastMessage: "The SEO report is looking great. Good job!",
    time: "1h ago",
    unread: 0,
    avatar: "https://i.pravatar.cc/150?u=jordan",
  },
  {
    id: "4",
    name: "Design System Group",
    lastMessage: "Mike: We need to update the button variants.",
    time: "3h ago",
    unread: 5,
    avatar: "https://i.pravatar.cc/150?u=design",
  },
];

export default function ChatList() {
  const router = useRouter();

  const renderChatItem = ({ item }: { item: typeof MOCK_CHATS[0] }) => (
    <TouchableOpacity 
      style={styles.chatItem} 
      activeOpacity={0.6}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_CHATS}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color={Theme.colors.textSecondary} />
              <Text style={styles.searchPlaceholder}>Search messages...</Text>
            </View>
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
  listContent: {
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
  unreadBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
