import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { FirebaseAuth, FirebaseProfile } from "../services/firebase";
import { SupabaseAuth, SupabaseProfile } from "../services/supabase";
import type { ProfileData } from "../services/supabase/profile";

type Provider = "firebase" | "supabase" | null;

// Unified profile type used throughout the app
export type UserProfile = ProfileData | null;

interface AuthContextType {
  provider: Provider;
  setProvider: (provider: Provider) => Promise<void>;
  user: UserProfile;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<Provider>(null);
  const [user, setUser] = useState<UserProfile>(null);
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

    const pathSegments = segments as string[];
    const inAuthGroup = pathSegments[0] === "(auth)";
    const inTabsGroup = pathSegments[0] === "(tabs)";
    const isRoot =
      pathSegments.length === 0 ||
      (pathSegments.length === 1 && pathSegments[0] === "index");

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

  /**
   * After auth sign-in/sign-up, fetch the actual profile data
   * from the profiles/users table and store that in context.
   */
  const fetchAndSetProfile = async (authUserId: string, p: Provider = provider) => {
    let profile = null;
    if (p === "firebase") {
      profile = await FirebaseProfile.getProfile(authUserId);
    } else if (p === "supabase") {
      profile = await SupabaseProfile.getProfile(authUserId);
    }
    if (profile) {
      setUser(profile as any);
      await AsyncStorage.setItem("user", JSON.stringify(profile));
    }
  };

  const signIn = async (email: string, password: string) => {
    let authUser;

    // Delegate to Business Logic / API Service
    if (provider === "firebase") {
      authUser = await FirebaseAuth.signIn(email, password);
      // Firebase: fetch profile data from Firestore users collection
      await fetchAndSetProfile(authUser.uid, "firebase");
    } else if (provider === "supabase") {
      authUser = await SupabaseAuth.signIn(email, password);
      // Supabase: fetch profile data from profiles table
      await fetchAndSetProfile(authUser.id, "supabase");
    } else {
      throw new Error("No backend provider selected");
    }
  };

  const signUp = async (email: string, password: string) => {
    let authUser;

    // Delegate to Business Logic / API Service
    if (provider === "firebase") {
      authUser = await FirebaseAuth.signUp(email, password);
      // Firebase: profile is created in Auth signup, fetch it
      await fetchAndSetProfile(authUser.uid, "firebase");
    } else if (provider === "supabase") {
      authUser = await SupabaseAuth.signUp(email, password);
      // Supabase: profile is auto-created by trigger, fetch it
      await fetchAndSetProfile(authUser!.id, "supabase");
    } else {
      throw new Error("No backend provider selected");
    }
  };

  /**
   * Re-fetch the profile from the database.
   * Call this after updating profile fields or avatar.
   */
  const refreshProfile = async () => {
    if (!user?.id || !provider) return;
    await fetchAndSetProfile(user.id, provider);
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
      value={{ provider, setProvider, user, signIn, signUp, signOut, refreshProfile }}
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
