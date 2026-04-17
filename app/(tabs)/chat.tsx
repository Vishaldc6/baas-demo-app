import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Chat() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <View style={styles.iconContainer}>
          <Feather name="message-square" size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.title}>No Messages Yet</Text>
        <Text style={styles.subtitle}>
          Start a conversation and it will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 22,
  },
});
