import { useAuth } from "@/components/AuthProvider";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/Theme";
import { FirebaseProject } from "../../services/firebase";
import { SupabaseProject } from "../../services/supabase";

const MOCK_PROJECTS = [
  {
    id: "1",
    name: "Brand Refresh",
    description: "Revitalizing the visual identity with a modern palette and typography.",
    members: 5,
    color: "#3B82F6",
  },
  {
    id: "2",
    name: "Mobile App Design",
    description: "Designing the core user flow and high-fidelity wireframes for iOS & Android.",
    members: 3,
    color: "#8B5CF6",
  },
  {
    id: "3",
    name: "Marketing Website",
    description: "Building a high-conversion landing page with interactive product demos.",
    members: 8,
    color: "#10B981",
  },
  {
    id: "4",
    name: "SEO Optimization",
    description: "Improving organic reach through technical SEO and content strategy.",
    members: 2,
    color: "#F59E0B",
  },
  {
    id: "5",
    name: "E-commerce Launch",
    description: "Setting up the digital storefront and payment integration for the new collection.",
    members: 12,
    color: "#EF4444",
  },
];

export default function Home() {
  const router = useRouter();
  const { provider } = useAuth();

  const [projectList, setProjectList] = useState<any[]>([]);

  useEffect(() => {
    fetchAllProjects();
  }, []);

  async function fetchAllProjects() {
    try {
      const data =
        provider === "firebase"
          ? await FirebaseProject.getProjectList()
          : await SupabaseProject.getProjectList();
      console.log("fetchAllProjects: ", { data });

      setProjectList(data as any[]);
    } catch (error) {
      console.log({ error });
    }
  }

  const renderProjectCard = ({ item }: { item: (typeof projectList)[0] }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/project/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.memberContainer}>
          <View style={styles.avatarStack}>
            {[1, 2, 3].map((i) => (
              <View 
                key={i} 
                style={[
                  styles.miniAvatar, 
                  { marginLeft: i === 1 ? 0 : -8, zIndex: 5 - i }
                ]} 
              />
            ))}
          </View>
          <Text style={styles.memberText}>{item.members?.length} members</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[...projectList, ...MOCK_PROJECTS]}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Projects</Text>
            <Text style={styles.headerSubtitle}>
              You have {[...projectList, ...MOCK_PROJECTS].length} active projects
            </Text>
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    borderWidth: 1.5,
    borderColor: Theme.colors.surface,
  },
  memberText: {
    fontSize: 13,
    fontWeight: "500",
    color: Theme.colors.textSecondary,
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
