import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { User as SupabaseUser } from "@supabase/supabase-js";
import * as FirebaseAuth from "../services/firebase/auth";
import * as SupabaseAuth from "../services/supabase/auth";

type Provider = "firebase" | "supabase" | null;
type User = { email: string } | SupabaseUser | null;

interface AuthContextType {
  provider: Provider;
  setProvider: (provider: Provider) => Promise<void>;
  user: User;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<Provider>(null);
  const [user, setUser] = useState<User>(null);
  const [isReady, setIsReady] = useState(false);

  const router = useRouter();
  const segments = useSegments();

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

  useEffect(() => {
    if (!isReady || !segments) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const isRoot =
      segments.length === 0 ||
      (segments.length === 1 && segments[0] === "index");

    if (!user && inTabsGroup) {
      router.replace(provider ? "/(auth)/sign-in" : "/");
    } else if (user && (inAuthGroup || isRoot)) {
      router.replace("/(tabs)/home");
    }
  }, [user, segments, provider, isReady]);

  const setProvider = async (p: Provider) => {
    setProviderState(p);
    if (p) await AsyncStorage.setItem("provider", p);
    else await AsyncStorage.removeItem("provider");
  };

  const signIn = async (email: string, password?: string) => {
    let resultUser;

    // Delegate to Business Logic / API Service
    if (provider === "firebase") {
      resultUser = await FirebaseAuth.signIn(email, password);
    } else if (provider === "supabase") {
      resultUser = await SupabaseAuth.signIn(email, password);
    } else {
      throw new Error("No backend provider selected");
    }

    setUser(resultUser);
    await AsyncStorage.setItem("user", JSON.stringify(resultUser));
  };

  const signUp = async (email: string, password?: string) => {
    let resultUser;

    // Delegate to Business Logic / API Service
    if (provider === "firebase") {
      resultUser = await FirebaseAuth.signUp(email, password);
    } else if (provider === "supabase") {
      resultUser = await SupabaseAuth.signUp(email, password);
    } else {
      throw new Error("No backend provider selected");
    }

    setUser(resultUser);
    await AsyncStorage.setItem("user", JSON.stringify(resultUser));
  };

  const signOut = async () => {
    // Delegate sign out to specific API
    if (provider === "firebase") {
      await FirebaseAuth.signOut();
    } else if (provider === "supabase") {
      await SupabaseAuth.signOut();
    }

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
