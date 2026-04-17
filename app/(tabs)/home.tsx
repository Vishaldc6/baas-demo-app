import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../components/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello, Welcome!</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Text style={styles.cardContent}>
          No new activity to show right now. Check back later!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 12,
  },
  cardContent: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
});
