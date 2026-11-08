import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  MessageSquare,
  Clock,
  User,
  Heart,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
} from 'lucide-react-native';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const ANIMATIONS = {
  anim1: require('../../assets/sendiyu_lottie/108f4fb6-1181-11ee-b065-4fd3e1c5a442.json'),
  anim2: require('../../assets/sendiyu_lottie/3b769c46-d4b5-11ee-9229-afbfa1f82773.json'),
  anim3: require('../../assets/sendiyu_lottie/5a40df34-117d-11ee-a1af-5fe2367006a3.json'),
  anim4: require('../../assets/sendiyu_lottie/9b7c7972-1187-11ee-96bf-af3ccc7d6968.json'),
  anim5: require('../../assets/sendiyu_lottie/a09ad288-1177-11ee-be96-53b4df923e7f.json'),
  anim6: require('../../assets/sendiyu_lottie/bf8f2232-1179-11ee-8f33-db8fe91f3c3c.json'),
  anim7: require('../../assets/sendiyu_lottie/c635fef8-d248-11ef-8418-db17c1b97f7f.json'),
  anim8: require('../../assets/sendiyu_lottie/ca9bbdae-1186-11ee-b5ca-b3d847f28449.json'),
  anim9: require('../../assets/sendiyu_lottie/cc26d92c-116a-11ee-9b51-1fe8e93a38e8.json'),
};

const ANIMATION_KEYS = ['anim1', 'anim2', 'anim3', 'anim4', 'anim5', 'anim6', 'anim7', 'anim8', 'anim9'];

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'posts'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit post state
  const [editingPost, setEditingPost] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [selectedAnim, setSelectedAnim] = useState('anim7');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      // 1. Fetch chats
      const { data: chatsData, error: chatsError } = await supabase
        .from('sendiyou_chats')
        .select(`
          *,
          post:sendiyou_posts(*),
          messages(content, created_at, sender_id)
        `)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      const processedChats = (chatsData || []).map((chat) => {
        let latestMessage = null;
        if (chat.messages && chat.messages.length > 0) {
          latestMessage = chat.messages.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest.created_at) ? current : latest
          );
        }

        const otherParticipantId =
          (chat.participant_ids || []).find((id) => id !== user.id) || chat.participant_ids?.[0];
        const isRevealed = chat.revealed_ids?.includes(otherParticipantId) || false;

        return {
          ...chat,
          latestMessage,
          isRevealed,
          lastActivity: latestMessage ? latestMessage.created_at : chat.created_at,
        };
      });

      processedChats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
      setChats(processedChats);

      // 2. Fetch user's own posts
      const { data: postsData, error: postsError } = await supabase
        .from('sendiyou_posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setMyPosts(postsData || []);
    } catch (err) {
      console.error('Error fetching messages dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDeletePost = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('sendiyou_posts').delete().eq('id', postId);
              if (error) throw error;
              setMyPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const handlePostClick = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('sendiyou_chats')
        .select('id')
        .eq('post_id', postId);
      if (error) throw error;

      if (data && data.length === 1) {
        navigation.navigate('Chat', { chatId: data[0].id });
      } else if (data && data.length > 1) {
        setActiveTab('chats');
        Alert.alert('Multiple Chats', "You have multiple active chats for this post. Check the 'Active Chats' tab.");
      } else {
        Alert.alert('No Connections', 'No one has connected to your post yet. When someone connects, the chat room will open!');
      }
    } catch (err) {
      console.error('Error checking chats:', err);
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditDesc(post.description || '');
    setSelectedAnim(post.selected_animation || 'anim7');
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('sendiyou_posts')
        .update({
          description: editDesc,
          selected_animation: selectedAnim,
        })
        .eq('id', editingPost.id);

      if (error) throw error;
      setMyPosts((prev) =>
        prev.map((p) =>
          p.id === editingPost.id
            ? { ...p, description: editDesc, selected_animation: selectedAnim }
            : p
        )
      );
      setEditingPost(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to update post.');
    } finally {
      setUpdating(false);
    }
  };

  const renderChatItem = ({ item }) => {
    const isGroup = item.post?.connection_type === 'Group';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chat', { chatId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            {isGroup ? <Users size={12} color={colors.primary} /> : <Heart size={12} color={colors.accentPink} />}
            <Text style={[styles.typeText, isGroup && { color: colors.primary }]}>
              {item.post?.connection_type || 'Direct'}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Clock size={11} color={colors.textMuted} />
            <Text style={styles.timeText}>
              {new Date(item.lastActivity).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.post?.title || 'Unknown Post'}
        </Text>

        <Text style={styles.lastMessageText} numberOfLines={1}>
          {item.latestMessage
            ? `${item.latestMessage.sender_id === user.id ? 'You: ' : ''}${item.latestMessage.content}`
            : 'No messages yet. Say hello! 👋'}
        </Text>

        <View style={styles.identityFooter}>
          <View style={[styles.identityPill, item.isRevealed && styles.identityRevealedPill]}>
            <User size={12} color={item.isRevealed ? colors.free : colors.textMuted} />
            <Text style={[styles.identityText, item.isRevealed && { color: colors.free }]}>
              {item.isRevealed ? 'Identity Revealed' : 'Anonymous'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePostClick(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            {item.connection_type === 'Group' ? (
              <Users size={12} color={colors.primary} />
            ) : (
              <Heart size={12} color={colors.accentPink} />
            )}
            <Text style={styles.typeText}>{item.connection_type}</Text>
          </View>
          <View style={styles.timeRow}>
            <Clock size={11} color={colors.textMuted} />
            <Text style={styles.timeText}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.postDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
          >
            <Edit2 size={14} color={colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeletePost(item.id)}
          >
            <Trash2 size={14} color={colors.busy} />
            <Text style={[styles.actionBtnText, { color: colors.busy }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Conversations" />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            Active Chats ({chats.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            My Requests ({myPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === 'chats' ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MessageSquare size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Active Conversations</Text>
              <Text style={styles.emptySub}>
                Explore SendiYou posts and connect with students on your campus!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('SendiYou')}
              >
                <Text style={styles.exploreBtnText}>Go to SendiYou</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={myPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPostItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Search size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Requests Created</Text>
              <Text style={styles.emptySub}>
                Create an anonymous connection post to make friends or find study groups!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('CreatePost')}
              >
                <Text style={styles.exploreBtnText}>Create a Post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Edit Post Modal */}
      <Modal visible={!!editingPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Post</Text>
              <TouchableOpacity onPress={() => setEditingPost(null)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={editingPost?.title || ''}
                editable={false}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Animation Pattern</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {ANIMATION_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.animPickerItem,
                      selectedAnim === key && styles.animPickerItemActive,
                    ]}
                    onPress={() => setSelectedAnim(key)}
                  >
                    <LottieView
                      source={ANIMATIONS[key]}
                      autoPlay
                      loop
                      style={{ width: 44, height: 44 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleUpdatePost}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.lg,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentPink,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  lastMessageText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  postDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  identityFooter: {
    marginTop: 4,
    flexDirection: 'row',
  },
  identityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  identityRevealedPill: {
    backgroundColor: colors.freeLight,
  },
  identityText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  postActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  deleteBtn: {
    backgroundColor: colors.busyLight,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
  },
  exploreBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  disabledInput: {
    opacity: 0.6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  animPickerItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  animPickerItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});

