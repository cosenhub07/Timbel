import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  Heart,
  Plus,
  Search,
  Clock,
  MessageCircle,
  Eye,
  EyeOff,
  Users,
  User as UserIcon,
  Sparkles,
} from 'lucide-react-native';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { apiFetch, API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

// Lottie animation sources (require at build time)
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

export default function SendiYouScreen({ navigation }) {
  const { user, profile, selectedCampus, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedCampus) {
      fetchPosts();
    } else {
      setFetchingPosts(false);
    }
  }, [selectedCampus]);

  const fetchPosts = async () => {
    if (!selectedCampus) return;
    setFetchingPosts(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('sendiyou_posts')
        .select(`*, users ( id, name, gender, branch, custom_avatar_url, bio, email )`)
        .or(`campus_id.eq.${selectedCampus.id},campus_id.is.null`)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setFetchingPosts(false);
    }
  };

  const handleStartChat = async (post) => {
    if (!user) return;
    if (post.creator_id === user.id) {
      Alert.alert('Your Post', 'This is your own post!');
      return;
    }
    if (post.preferred_gender !== 'Any' && post.preferred_gender !== profile?.gender) {
      Alert.alert('Restricted', `This request is for ${post.preferred_gender} only.`);
      return;
    }

    try {
      if (post.connection_type === 'Group') {
        const data = await apiFetch(`/api/sendiyou/join-group`, {
          method: 'POST',
          body: JSON.stringify({ post_id: post.id, user_id: user.id }),
        });
        navigation.navigate('Chat', { chatId: data.chat_id });
      } else {
        const data = await apiFetch(`/api/sendiyou/start-individual-chat`, {
          method: 'POST',
          body: JSON.stringify({ post_id: post.id, user_id: user.id }),
        });
        navigation.navigate('Chat', { chatId: data.chat_id });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start chat');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.connection_type?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderPost = ({ item }) => {
    const animSource = ANIMATIONS[item.selected_animation] || ANIMATIONS.anim7;
    const isAnonymous = item.is_anonymous;
    const creatorName = isAnonymous
      ? item.display_name || 'Anonymous'
      : item.users?.name || 'Someone';
    const isGroup = item.connection_type === 'Group';

    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        activeOpacity={0.85}
      >
        {/* Animation header */}
        <View style={styles.postAnimContainer}>
          <LottieView
            source={animSource}
            autoPlay
            loop
            style={styles.postAnim}
          />
        </View>

        {/* Post content */}
        <View style={styles.postContent}>
          <View style={styles.postTopRow}>
            <View style={styles.postAuthorRow}>
              {isAnonymous ? (
                <EyeOff size={14} color={colors.textMuted} />
              ) : item.users?.custom_avatar_url ? (
                <Image
                  source={{ uri: item.users.custom_avatar_url }}
                  style={styles.postAvatar}
                />
              ) : (
                <View style={styles.postAvatarPlaceholder}>
                  <UserIcon size={14} color={colors.textSecondary} />
                </View>
              )}
              <Text style={styles.postAuthorName} numberOfLines={1}>
                {creatorName}
              </Text>
            </View>
            <View style={[styles.typeBadge, isGroup && styles.typeBadgeGroup]}>
              {isGroup ? <Users size={10} color={colors.primaryHover} /> : <Heart size={10} color={colors.accentPink} />}
              <Text style={[styles.typeBadgeText, isGroup && styles.typeBadgeTextGroup]}>
                {isGroup ? 'Group' : '1-on-1'}
              </Text>
            </View>
          </View>

          <Text style={styles.postTitle} numberOfLines={2}>
            {item.title || item.display_name}
          </Text>
          {item.description ? (
            <Text style={styles.postDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Tags */}
          {item.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.postFooter}>
            <View style={styles.postTimeRow}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={styles.postTime}>{formatTimeAgo(item.created_at)}</Text>
            </View>

            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => handleStartChat(item)}
              activeOpacity={0.8}
            >
              <MessageCircle size={14} color={colors.white} />
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="SendiYou 💌" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search connections..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.feedColumns}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          fetchingPosts ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Sparkles size={40} color={colors.primary} />
              <Text style={styles.emptyTitle}>No Posts Yet</Text>
              <Text style={styles.emptySub}>Be the first to create a connection post!</Text>
            </View>
          )
        }
      />

      {/* FAB: Create Post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.85}
      >
        <Plus size={28} color={colors.white} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  feedContent: {
    padding: spacing.sm,
    paddingBottom: 90,
  },
  feedColumns: {
    gap: spacing.sm,
  },
  postCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    maxWidth: '50%',
  },
  postAnimContainer: {
    height: 100,
    backgroundColor: 'rgba(99, 91, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAnim: {
    width: 80,
    height: 80,
  },
  postContent: {
    padding: spacing.md,
    gap: 6,
  },
  postTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  postAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  postAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorName: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  typeBadgeGroup: {
    backgroundColor: colors.primaryLight,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.accentPink,
  },
  typeBadgeTextGroup: {
    color: colors.primaryHover,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
  },
  postDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.cardSecondary,
  },
  tagText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  postTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  postTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
  connectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
