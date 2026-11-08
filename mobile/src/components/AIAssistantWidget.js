import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { X, Send, Bot, User, Sparkles } from 'lucide-react-native';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'ai',
      text: 'Namaste! Main Timbel ki AI Assistant hoon. Aapko timetable, classes, ya platform ke baare me koi query hai toh zaroor puchiye! 🎓',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const newMsgObj = { id: Date.now().toString(), role: 'user', text: userMsg };
    setInput('');
    setMessages((prev) => [...prev, newMsgObj]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await apiFetch('/api/chat/ask', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
          user_id: user?.id || session?.user?.id,
        }),
      });

      const replyText = res.reply || 'Main samajh gayi! Kuch aur puchna hai?';
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'ai', text: replyText },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: 'Maaf kijiye, abhi backend me thodi dikkat hai. Kripya thodi der baad try karein.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isAi = item.role === 'ai';
    return (
      <View style={[styles.msgRow, isAi ? styles.aiRow : styles.userRow]}>
        {isAi && (
          <View style={styles.aiAvatar}>
            <Bot size={16} color={colors.primary} />
          </View>
        )}
        <View style={[styles.bubble, isAi ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.msgText, isAi ? styles.aiMsgText : styles.userMsgText]}>
            {item.text}
          </Text>
        </View>
        {!isAi && (
          <View style={styles.userAvatar}>
            <User size={16} color={colors.white} />
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <LottieView
          source={require('../../assets/assistent.json')}
          autoPlay
          loop
          style={styles.lottieBtn}
        />
        <View style={styles.fabBadge}>
          <Sparkles size={10} color={colors.white} />
        </View>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerTitleRow}>
                <View style={styles.botIconCircle}>
                  <Bot size={20} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Timbel AI Assistant</Text>
                  <Text style={styles.headerSubtitle}>Timetable & Campus Helper</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}

            {/* Input Bar */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask about timetable, free rooms..."
                placeholderTextColor={colors.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} color={input.trim() ? colors.white : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  lottieBtn: {
    width: 50,
    height: 50,
  },
  fabBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '75%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  listContent: {
    padding: spacing.md,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiMsgText: {
    color: colors.text,
  },
  userMsgText: {
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.cardSecondary,
  },
});

