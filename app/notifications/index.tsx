import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Task Assigned",
    description: "You have been assigned to 'Mobile App Design' by Sarah Chen.",
    timestamp: "10m ago",
    unread: true,
  },
  {
    id: "2",
    title: "Project Update",
    description: "The 'Brand Refresh' project has been moved to the 'Production' phase.",
    timestamp: "2h ago",
    unread: true,
  },
  {
    id: "3",
    title: "New Message",
    description: "Alex Rivera sent you a message regarding the latest UI assets.",
    timestamp: "5h ago",
    unread: false,
  },
  {
    id: "4",
    title: "Task Completed",
    description: "Mike Ross completed 'Review brand colors' in Brand Refresh.",
    timestamp: "1d ago",
    unread: false,
  },
];

export default function Notifications() {
  const router = useRouter();

  const renderNotification = ({ item }: { item: typeof MOCK_NOTIFICATIONS[0] }) => (
    <TouchableOpacity
      style={[styles.notificationCard, item.unread && styles.unreadCard]}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, item.unread && styles.unreadText]}>
              {item.title}
            </Text>
            {item.unread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
          <Text style={styles.timeText}>{item.timestamp}</Text>
        </View>
        <Feather name="chevron-right" size={16} color={Theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markReadText}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No notifications yet</Text>
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
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
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
  markReadText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 40,
  },
  notificationCard: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  unreadCard: {
    backgroundColor: "#F9FAFB", // Very subtle highlight
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoContainer: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
  },
  unreadText: {
    color: Theme.colors.text,
    fontWeight: "700",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
});
