import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

type Provider = "firebase" | "supabase" | null;
type User = { email: string } | null;

interface AuthContextType {
  provider: Provider;
  setProvider: (provider: Provider) => Promise<void>;
  user: User;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<Provider>(null);
  const [user, setUser] = useState<User>(null);
  const [isReady, setIsReady] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  // Load from Storage on App Mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedProvider = await AsyncStorage.getItem("provider");
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedProvider) setProviderState(storedProvider as Provider);
      } catch (error) {
        console.error("Failed to load auth state", error);
      } finally {
        setIsReady(true);
      }
    };
    loadState();
  }, []);

  // Protected Route Guards logic
  useEffect(() => {
    if (!isReady || !segments) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isRoot =
      segments.length === 0 ||
      (segments.length === 1 && segments[0] === "index");

    if (!user && inTabsGroup) {
      // Guard: Redirect unauthorized users back appropriately
      router.replace(provider ? "/(auth)/sign-in" : "/");
    } else if (user && (inAuthGroup || isRoot)) {
      // Guard: Redirect authorized users directly to the protected section
      router.replace("/(tabs)/home");
    }
  }, [user, segments, provider, isReady]);

  const setProvider = async (p: Provider) => {
    setProviderState(p);
    if (p) await AsyncStorage.setItem("provider", p);
    else await AsyncStorage.removeItem("provider");
  };

  const signIn = async (email: string) => {
    const newUser = { email };
    setUser(newUser);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
  };

  const signUp = async (email: string) => {
    const newUser = { email };
    setUser(newUser);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
  };

  const signOut = async () => {
    setUser(null);
    setProviderState(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("provider");
    router.replace("/");
  };

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAFAFA",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{ provider, setProvider, user, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
