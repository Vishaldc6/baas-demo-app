import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const renderOption = (
    icon: any,
    label: string,
    url?: string | any,
    value?: string | number,
    color = Theme.colors.text
  ) => (
    <TouchableOpacity
      style={styles.option}
      activeOpacity={0.6}
      onPress={() => url && router.push(url)}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.iconBox, { backgroundColor: color + "10" }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.optionRight}>
        {value !== undefined && <Text style={styles.optionValue}>{value}</Text>}
        <Feather
          name="chevron-right"
          size={20}
          color={Theme.colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?name=${user?.email}&background=2563EB&color=fff`,
          }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Account Owner</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.card}>
          {renderOption("check-square", "My Tasks", "/task", 12)}
          {renderOption("grid", "Active Projects", "/home", 5)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          {renderOption("bell", "Notifications", "/notifications")}
          {renderOption("shield", "Security")}
          {renderOption("moon", "Appearance")}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          {renderOption("help-circle", "Help Center")}
          {renderOption("info", "About App")}
        </View>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={signOut}
        activeOpacity={0.8}
      >
        <Feather name="log-out" size={20} color={Theme.colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Theme.spacing.md,
    borderWidth: 4,
    borderColor: Theme.colors.surface,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  optionValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.colors.primary,
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    marginTop: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.error + "20",
  },
  signOutText: {
    marginLeft: Theme.spacing.sm,
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.error,
  },
});
