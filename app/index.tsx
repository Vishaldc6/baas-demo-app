import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../components/AuthProvider";
import { Theme } from "../constants/Theme";

export default function Index() {
  const router = useRouter();
  const { setProvider } = useAuth();

  const handleSelect = (provider: "firebase" | "supabase") => {
    setProvider(provider);
    router.push("/(auth)/sign-in");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <LinearGradient
              colors={Theme.colors.primaryGradient}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>B</Text>
            </LinearGradient>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Select your preferred backend provider to get started with your projects.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => handleSelect("firebase")}
            activeOpacity={0.8}
          >
            <View style={[styles.providerDot, { backgroundColor: "#FFCA28" }]} />
            <Text style={styles.buttonLabel}>Use Firebase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => handleSelect("supabase")}
            activeOpacity={0.8}
          >
            <View style={[styles.providerDot, { backgroundColor: "#3ECF8E" }]} />
            <Text style={styles.buttonLabel}>Use Supabase</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Built for high-performance teams</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: Theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoBox: {
    marginBottom: 24,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Theme.colors.text,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  buttonGroup: {
    gap: 16,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    padding: 20,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  providerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    fontWeight: "500",
  },
});
