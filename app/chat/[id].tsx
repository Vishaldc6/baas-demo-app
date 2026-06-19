import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../../components/AuthProvider";
import { Theme } from "../../constants/Theme";
import { FirebaseChat, FirebaseProject } from "../../services/firebase";
import { SupabaseChat, SupabaseProject, SupabaseProjectMembers } from "../../services/supabase";

function formatTime(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60000) return "Now";
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function resolveDate(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.toMillis) return new Date(value.toMillis()).toISOString();
  if (value.seconds) return new Date(value.seconds * 1000).toISOString();
  return null;
}

function formatDateSeparator(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString();
}

export default function ChatConversation() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { provider, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const membersMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of members) {
      map[m.id] = m;
    }
    return map;
  }, [members]);

  const projectId = id as string;

  const loadMessages = useCallback(async () => {
    if (!provider || !projectId) return;
    try {
      setError(null);
      let data: any[] = [];
      if (provider === "firebase") {
        data = await FirebaseChat.getProjectMessages(projectId);
      } else if (provider === "supabase") {
        data = await SupabaseChat.getProjectMessages(projectId);
      }
      setMessages(data || []);
    } catch (err: any) {
      console.error("Failed to load messages:", err);
      setError(err.message || "Failed to load messages");
    }
  }, [provider, projectId]);

  const loadMeta = useCallback(async () => {
    if (!provider || !projectId || !user?.id) return;
    try {
      if (provider === "firebase") {
        const [projectData, fetchedMembers] = await Promise.all([
          FirebaseProject.getProjectById(projectId),
          FirebaseProject.getProjectMembers(projectId),
        ]);
        setProjectName(projectData?.name || "");
        setMembers(fetchedMembers || []);
      } else if (provider === "supabase") {
        const [projectData, fetchedMembers] = await Promise.all([
          SupabaseProject.getProjectById(projectId),
          SupabaseProjectMembers.getProjectMembers(projectId),
        ]);
        setProjectName(projectData?.name || "");
        setMembers(fetchedMembers || []);
      }
    } catch (err: any) {
      console.error("Failed to load chat meta:", err);
    }
  }, [provider, projectId, user?.id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadMessages(), loadMeta()]).finally(() => setLoading(false));
  }, [loadMessages, loadMeta]);

  // Real-time subscription
  useEffect(() => {
    if (!provider || !projectId) return;

    let unsubscribe: any = null;

    if (provider === "firebase") {
      unsubscribe = FirebaseChat.listenToProjectMessages(projectId, (newMessages) => {
        setMessages(newMessages);
      });
    } else if (provider === "supabase") {
      const subscription = SupabaseChat.listenToNewMessages(projectId, (newMessage) => {
        console.log('newMessage from realtime: ', { newMessage });

        setMessages(prev => {
          // Deduplicate: skip if we already have this message
          if (prev.some(m => m.id === newMessage.id)) return prev;

          // Check if there is a matching optimistic message to replace (same sender and content)
          const optIdx = prev.findIndex(
            m => m._optimistic && m.sender_id === newMessage.sender_id && m.content === newMessage.content
          );
          if (optIdx !== -1) {
            const updated = [...prev];
            updated[optIdx] = newMessage;
            return updated;
          }

          return [...prev, newMessage];
        });
      });
      unsubscribe = () => {
        console.log('[Chat] Unsubscribing from realtime channel');
        subscription.unsubscribe();
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [provider, projectId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !projectId || !user?.id || !provider || sending) return;

    setSending(true);
    setInputText("");

    // Optimistic message so the sender sees it immediately
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      project_id: projectId,
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      if (provider === "firebase") {
        await FirebaseChat.sendMessage(projectId, user.id, text);
      } else if (provider === "supabase") {
        const savedMessage = await SupabaseChat.sendMessage(projectId, user.id, text);
        // Replace optimistic message with the real server message
        setMessages(prev =>
          prev.map(m => (m.id === optimisticId ? { ...savedMessage } : m))
        );
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on failure and restore input
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return "You";
    const member = membersMap[senderId];
    return member?.name || senderId?.slice(0, 6) || "Unknown";
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const senderId = item.sender_id || item.user_id;
    const isMe = senderId === user?.id;
    const senderName = getSenderName(senderId);
    const content = item.content || item.message || "";
    const createdAt = resolveDate(item.createdAt_ || item.created_at);

    // Date separator logic
    let showDateSeparator = false;
    let dateSeparatorText = "";
    if (createdAt) {
      const currentDateString = new Date(createdAt).toDateString();
      if (index === 0) {
        showDateSeparator = true;
        dateSeparatorText = formatDateSeparator(createdAt);
      } else {
        const prevItem = messages[index - 1];
        const prevCreatedAt = resolveDate(prevItem.createdAt_ || prevItem.created_at);
        if (prevCreatedAt) {
          const prevDateString = new Date(prevCreatedAt).toDateString();
          if (currentDateString !== prevDateString) {
            showDateSeparator = true;
            dateSeparatorText = formatDateSeparator(createdAt);
          }
        } else {
          showDateSeparator = true;
          dateSeparatorText = formatDateSeparator(createdAt);
        }
      }
    }

    return (
      <View style={{ width: "100%" }}>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>{dateSeparatorText}</Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
          {!isMe && <Text style={styles.senderName}>{senderName}</Text>}
          <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
              {content}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTime(createdAt)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={Theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.navTitle} numberOfLines={1}>{projectName || "Chat"}</Text>
          <Text style={styles.navSubtitle}>
            {members.length > 0 ? `${members.length} members` : ""}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="info" size={22} color={Theme.colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={Theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Send the first message to start the conversation</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={Theme.colors.textSecondary}
          multiline
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          disabled={!inputText.trim() || sending}
          onPress={handleSend}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: Theme.spacing.sm,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Theme.colors.text,
  },
  navSubtitle: {
    fontSize: 12,
    color: Theme.colors.success,
    fontWeight: "600",
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  messageWrapper: {
    marginBottom: Theme.spacing.md,
    maxWidth: "80%",
  },
  myMessageWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessageWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  senderName: {
    fontSize: 11,
    fontWeight: "700",
    color: Theme.colors.primary,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  myBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: Theme.colors.text,
  },
  timeText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Theme.spacing.md,
    gap: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.textSecondary,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === "ios" ? 30 : Theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 15,
    color: Theme.colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.border,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Theme.spacing.lg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
