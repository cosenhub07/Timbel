import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Users,
  Crown,
  Sparkles,
  X,
  UserCheck,
  UserMinus,
  Lock,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { apiFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const DEFAULT_BANNER =
  'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

export default function ChatScreen({ route, navigation }) {
  const { chatId } = route.params || {};
  const { user, profile } = useAuth();

  const [chatInfo, setChatInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [myAlias, setMyAlias] = useState(null);

  // Modals
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const flatListRef = useRef(null);

  const isGroup = chatInfo?.is_group === true;

  const getMember = useCallback(
    (senderId) => members.find((m) => m.user_id === senderId),
    [members]
  );
  const getAliasFor = useCallback(
    (id) => getMember(id)?.alias || 'Anonymous',
    [getMember]
  );
  const isRevealedFor = useCallback(
    (id) => getMember(id)?.is_revealed || chatInfo?.revealed_ids?.includes(id) || false,
    [getMember, chatInfo]
  );

  useEffect(() => {
    if (!user || !chatId) return;

    const fetchChatData = async () => {
      try {
        const { data: chatData, error: chatError } = await supabase
          .from('sendiyou_chats')
          .select(`
            *,
            sendiyou_posts (
              title, creator_id, is_anonymous, connection_type,
              users ( name, gender, branch, custom_avatar_url )
            )
          `)
          .eq('id', chatId)
          .single();

        if (chatError) throw chatError;
        if (!chatData.participant_ids.includes(user.id)) {
          Alert.alert('Access Denied', 'You are not a participant in this conversation.');
          navigation.goBack();
          return;
        }
        setChatInfo(chatData);

        // Fetch messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*, users(name, custom_avatar_url)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        setMessages(msgData || []);

        // Fetch group members if group chat
        if (chatData.is_group) {
          try {
            const data = await apiFetch(`/api/sendiyou/group-members/${chatId}`);
            setMembers(data || []);
            const me = (data || []).find((m) => m.user_id === user.id);
            if (me) setMyAlias(me.alias);
          } catch (e) {
            console.error('Error fetching group members:', e);
          }
        }
      } catch (err) {
        console.error('Error loading chat:', err);
        Alert.alert('Error', 'Failed to load chat.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, user, navigation]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, custom_avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, users: userData }]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sendiyou_chats', filter: `id=eq.${chatId}` },
        (payload) => setChatInfo((prev) => ({ ...prev, ...payload.new }))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'group_members', filter: `chat_id=eq.${chatId}` },
        async () => {
          try {
            const data = await apiFetch(`/api/sendiyou/group-members/${chatId}`);
            setMembers(data || []);
          } catch (e) {}
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_members', filter: `chat_id=eq.${chatId}` },
        async () => {
          try {
            const data = await apiFetch(`/api/sendiyou/group-members/${chatId}`);
            setMembers(data || []);
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await supabase.from('messages').insert([
        {
          chat_id: chatId,
          sender_id: user.id,
          content: text,
          type: 'USER_MESSAGE',
        },
      ]);

      const others = (chatInfo?.participant_ids || []).filter((id) => id !== user.id);
      if (others.length > 0) {
        await supabase.from('notifications').insert(
          others.map((id) => ({
            user_id: id,
            sender_id: user.id,
            type: 'NEW_MESSAGE',
            content: `New message in "${chatInfo?.sendiyou_posts?.title || 'Chat'}"`,
            link: `/chat/${chatId}`,
          }))
        );
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleToggleIdentity = async (action) => {
    const isRevealing = action === 'reveal';
    const confirmMsg = isRevealing
      ? isGroup
        ? `Your real name will be visible to all members until hidden.`
        : 'Your real name will be visible to the other person until hidden.'
      : 'You will appear anonymous again.';

    Alert.alert(isRevealing ? 'Reveal Identity' : 'Hide Identity', confirmMsg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isRevealing ? 'Reveal' : 'Hide',
        onPress: async () => {
          setRevealing(true);
          try {
            await apiFetch(`/api/sendiyou/toggle-identity`, {
              method: 'POST',
              body: JSON.stringify({ chat_id: chatId, user_id: user.id, action }),
            });

            setChatInfo((prev) => {
              let newRevealedIds = [...(prev.revealed_ids || [])];
              if (isRevealing) {
                if (!newRevealedIds.includes(user.id)) newRevealedIds.push(user.id);
              } else {
                newRevealedIds = newRevealedIds.filter((id) => id !== user.id);
              }
              return { ...prev, revealed_ids: newRevealedIds };
            });

            setMembers((prev) =>
              prev.map((m) => (m.user_id === user.id ? { ...m, is_revealed: isRevealing } : m))
            );
          } catch (err) {
            Alert.alert('Error', `Failed to ${action} identity.`);
          } finally {
            setRevealing(false);
          }
        },
      },
    ]);
  };

  const handleKickMember = (targetMember) => {
    const alias = targetMember.alias;
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${alias} from this group? They cannot rejoin.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch(`/api/sendiyou/kick-member`, {
                method: 'POST',
                body: JSON.stringify({
                  chat_id: chatId,
                  user_id: user.id,
                  target_user_id: targetMember.user_id,
                }),
              });

              setMembers((prev) => prev.filter((m) => m.user_id !== targetMember.user_id));
              setChatInfo((prev) => ({
                ...prev,
                participant_ids: (prev.participant_ids || []).filter(
                  (id) => id !== targetMember.user_id
                ),
              }));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member.');
            }
          },
        },
      ]
    );
  };

  if (loading || !chatInfo) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const post = chatInfo.sendiyou_posts;
  const hasRevealed = isRevealedFor(user.id);

  // 1-on-1 other user info
  const otherUserId = !isGroup ? chatInfo.participant_ids.find((id) => id !== user.id) : null;
  const otherHasRevealed = otherUserId ? isRevealedFor(otherUserId) : false;
  let otherName = 'Anonymous Peer';
  if (!isGroup) {
    if (otherHasRevealed) otherName = 'Identity Revealed ✨';
    else if (otherUserId === post?.creator_id)
      otherName = post?.is_anonymous ? 'Anonymous User' : post?.users?.name || 'Anonymous User';
  }

  const renderMessageItem = ({ item }) => {
    if (item.type === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <Sparkles size={12} color={colors.free} />
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    const isMe = item.sender_id === user.id;
    const senderMember = getMember(item.sender_id);
    const senderRevealed = isRevealedFor(item.sender_id);
    const isCreator = item.sender_id === post?.creator_id;

    let displayName;
    if (isGroup) {
      const alias = getAliasFor(item.sender_id);
      if (isMe) displayName = `${myAlias || alias} (You)`;
      else if (senderRevealed) displayName = `${alias} → ${senderMember?.users?.name || 'Student'}`;
      else displayName = alias;
    } else {
      if (isMe) displayName = 'You';
      else if (senderRevealed) displayName = item.users?.name || 'Revealed Student';
      else if (isCreator && !post?.is_anonymous) displayName = item.users?.name || 'Creator';
      else displayName = 'Anonymous';
    }

    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgWrapperRight : styles.msgWrapperLeft]}>
        <View style={styles.msgSenderRow}>
          {isGroup && isCreator && !isMe && <Crown size={11} color="#FBBF24" />}
          <Text style={styles.msgSenderText}>{displayName}</Text>
          {senderRevealed && !isMe && <Eye size={11} color={colors.free} />}
        </View>

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
        </View>

        <Text style={styles.msgTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => isGroup && setShowMembersModal(true)}
          activeOpacity={isGroup ? 0.7 : 1}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isGroup ? `Group (${chatInfo.participant_ids.length})` : otherName}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {isGroup ? 'Tap to view members' : post?.title || 'SendiYou Connection'}
          </Text>
        </TouchableOpacity>

        {/* Reveal / Hide Button */}
        <TouchableOpacity
          style={[styles.revealBtn, hasRevealed && styles.hideBtn]}
          onPress={() => handleToggleIdentity(hasRevealed ? 'hide' : 'reveal')}
          disabled={revealing}
        >
          {hasRevealed ? (
            <>
              <EyeOff size={13} color={colors.free} />
              <Text style={styles.hideBtnText}>Hide</Text>
            </>
          ) : (
            <>
              <Eye size={13} color={colors.primary} />
              <Text style={styles.revealBtnText}>Reveal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={isGroup ? `Chat as ${myAlias || 'Anonymous'}...` : 'Type an anonymous message...'}
          placeholderTextColor={colors.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Members Modal (Group) */}
      <Modal visible={showMembersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Group Members ({members.length})</Text>
                <Text style={styles.modalSub}>
                  {members.filter((m) => m.is_revealed).length} revealed
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {members.map((m) => {
                const isMe = m.user_id === user.id;
                const isCreator = m.user_id === post?.creator_id;
                const revealed = m.is_revealed;
                return (
                  <TouchableOpacity
                    key={m.user_id}
                    style={styles.memberRow}
                    onPress={() => {
                      if (revealed) setSelectedMember(m);
                    }}
                    activeOpacity={revealed ? 0.7 : 1}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {revealed ? m.users?.name?.charAt(0).toUpperCase() || '?' : '?'}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.memberAlias}>{m.alias}</Text>
                        {isMe && <Text style={styles.youBadge}>You</Text>}
                        {isCreator && <Crown size={12} color="#FBBF24" />}
                      </View>
                      <Text style={styles.memberStatus}>
                        {revealed ? m.users?.name || 'Identity Revealed' : 'Identity Hidden'}
                      </Text>
                    </View>

                    {user.id === post?.creator_id && !isMe && !isCreator && (
                      <TouchableOpacity
                        style={styles.kickBtn}
                        onPress={() => handleKickMember(m)}
                      >
                        <UserMinus size={14} color={colors.busy} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Revealed Member Profile Modal */}
      <Modal visible={!!selectedMember} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.profileModalCard}>
            <TouchableOpacity
              style={styles.profileClose}
              onPress={() => setSelectedMember(null)}
            >
              <X size={18} color={colors.white} />
            </TouchableOpacity>

            <View style={styles.profileBanner} />
            <View style={styles.profileContent}>
              <View style={styles.profileAvatarCircle}>
                <Text style={styles.profileAvatarText}>
                  {selectedMember?.users?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>

              <Text style={styles.profileAlias}>🎭 {selectedMember?.alias}</Text>
              <Text style={styles.profileName}>{selectedMember?.users?.name}</Text>
              <Text style={styles.profileBranch}>
                {selectedMember?.users?.branch || 'Campus Student'}
              </Text>

              {selectedMember?.users?.bio && (
                <Text style={styles.profileBio}>"{selectedMember.users.bio}"</Text>
              )}

              <View style={styles.profilePills}>
                <View style={styles.profilePill}>
                  <Text style={styles.profilePillText}>
                    {selectedMember?.users?.gender || 'Student'}
                  </Text>
                </View>
                <View style={[styles.profilePill, styles.profileRevealedPill]}>
                  <UserCheck size={12} color={colors.free} />
                  <Text style={[styles.profilePillText, { color: colors.free }]}>Revealed</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.3)',
  },
  revealBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  hideBtn: {
    backgroundColor: colors.freeLight,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  hideBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.free,
  },
  messagesList: {
    padding: spacing.md,
    gap: 10,
  },
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: colors.freeLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginVertical: 4,
  },
  systemMessageText: {
    fontSize: 11,
    color: colors.free,
    fontWeight: '600',
  },
  msgWrapper: {
    maxWidth: '80%',
    marginBottom: 6,
  },
  msgWrapperRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgWrapperLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgSenderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  msgSenderText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleTextMe: {
    color: colors.white,
  },
  bubbleTextThem: {
    color: colors.text,
  },
  msgTime: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalSub: { fontSize: 12, color: colors.textMuted },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: colors.white, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberAlias: { fontSize: 14, fontWeight: '700', color: colors.text },
  youBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  memberStatus: { fontSize: 12, color: colors.textMuted },
  kickBtn: {
    padding: 8,
    backgroundColor: colors.busyLight,
    borderRadius: borderRadius.sm,
  },
  // Profile card modal
  profileModalCard: {
    backgroundColor: colors.surface,
    margin: 24,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 4,
  },
  profileBanner: {
    height: 80,
    backgroundColor: colors.primary,
  },
  profileContent: {
    alignItems: 'center',
    padding: spacing.lg,
    marginTop: -40,
  },
  profileAvatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileAvatarText: { fontSize: 24, fontWeight: '700', color: colors.white },
  profileAlias: { fontSize: 12, color: colors.primary, fontWeight: '700', marginBottom: 2 },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.text },
  profileBranch: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  profileBio: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  profilePills: { flexDirection: 'row', gap: 8 },
  profilePill: {
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRevealedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.freeLight,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  profilePillText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
});

