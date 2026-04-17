import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../components/AuthProvider";

export default function Profile() {
  const { user, provider, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {provider ? provider.toUpperCase() : "NO PROVIDER set"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Feather
          name="log-out"
          size={20}
          color="#EF4444"
          style={styles.buttonIcon}
        />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 24,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#6B7280",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  badgeContainer: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  buttonIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
