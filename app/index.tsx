import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../components/AuthProvider";

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
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Select your backend provider to continue
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.firebaseButton]}
          onPress={() => handleSelect("firebase")}
        >
          <Text style={styles.buttonText}>Use Firebase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.supabaseButton]}
          onPress={() => handleSelect("supabase")}
        >
          <Text style={styles.buttonText}>Use Supabase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 48,
    textAlign: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firebaseButton: {
    backgroundColor: "#FFCA28",
  },
  supabaseButton: {
    backgroundColor: "#3ECF8E",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
