import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  GraduationCap,
  Building,
  Heart,
  MessageCircle,
  LogOut,
  Edit3,
  Camera,
  X,
  Check,
} from 'lucide-react-native';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const DEFAULT_BANNER =
  'https://res.cloudinary.com/dga14nmzn/image/upload/v1784358679/cosen_banner_wwpfb6.png';

export default function ProfileScreen({ navigation }) {
  const { user, profile, setProfile, signOut, selectedCampus } = useAuth();

  const [stats, setStats] = useState({ totalPosts: 0, activeChats: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Edit profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
      setBioInput(profile?.bio || '');
    }
  }, [user, profile]);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const [postsRes, chatsRes] = await Promise.all([
        supabase
          .from('sendiyou_posts')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id),
        supabase
          .from('sendiyou_chats')
          .select('*', { count: 'exact', head: true })
          .contains('participant_ids', [user.id]),
      ]);

      setStats({
        totalPosts: postsRes.count || 0,
        activeChats: chatsRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching profile stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are needed to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadingImage(true);

        const ext = asset.uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}_avatar_${Date.now()}.${ext}`;
        const filePath = `avatars/${fileName}`;

        // Convert base64 to array buffer or formData
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: `image/${ext}`,
        });

        const { error: uploadError } = await supabase.storage
          .from('user_uploads')
          .upload(filePath, formData);

        if (uploadError) {
          // If direct upload fails, fallback to updating avatar url directly if user has custom URL
          console.error('Storage upload error:', uploadError);
        }

        const { data: publicUrlData } = supabase.storage
          .from('user_uploads')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData?.publicUrl || asset.uri;

        const { error: updateError } = await supabase
          .from('users')
          .update({ custom_avatar_url: publicUrl })
          .eq('id', user.id);

        if (!updateError) {
          setProfile((prev) => ({ ...prev, custom_avatar_url: publicUrl }));
          Alert.alert('Success', 'Avatar updated!');
        }
      }
    } catch (err) {
      console.error('Avatar change error:', err);
      Alert.alert('Error', 'Failed to update avatar.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ bio: bioInput.trim() })
        .eq('id', user.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev, bio: bioInput.trim() }));
      setShowEditModal(false);
      Alert.alert('Saved', 'Your bio has been updated.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save bio.');
    } finally {
      setSavingBio(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner + Avatar Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profile?.poster_url || DEFAULT_BANNER }}
            style={styles.banner}
          />

          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
              {profile?.custom_avatar_url ? (
                <Image source={{ uri: profile.custom_avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraPill}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Camera size={13} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile?.name || 'Campus Student'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {profile?.bio ? (
              <Text style={styles.bioText}>"{profile.bio}"</Text>
            ) : (
              <Text style={styles.bioPlaceholder}>No bio set yet.</Text>
            )}

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setShowEditModal(true)}
            >
              <Edit3 size={14} color={colors.primary} />
              <Text style={styles.editProfileBtnText}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Heart size={20} color={colors.accentPink} />
            <Text style={styles.statCount}>
              {loadingStats ? '...' : stats.totalPosts}
            </Text>
            <Text style={styles.statLabel}>My Requests</Text>
          </View>

          <View style={styles.statBox}>
            <MessageCircle size={20} color={colors.primary} />
            <Text style={styles.statCount}>
              {loadingStats ? '...' : stats.activeChats}
            </Text>
            <Text style={styles.statLabel}>Active Chats</Text>
          </View>
        </View>

        {/* Academic Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Campus Details</Text>

          <View style={styles.detailRow}>
            <Building size={16} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Campus</Text>
              <Text style={styles.detailValue}>
                {selectedCampus?.name || 'Main Campus'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <GraduationCap size={16} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Branch</Text>
              <Text style={styles.detailValue}>
                {profile?.branch || 'Not Specified'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <User size={16} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>
                {profile?.gender || 'Not Specified'}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Mail size={16} color={colors.primary} />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Enrollment</Text>
              <Text style={styles.detailValue}>
                {profile?.enrollment_number || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut size={18} color={colors.busy} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Edit Bio Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bio</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.bioInput}
              placeholder="Tell others a little about yourself (interests, hobbies)..."
              placeholderTextColor={colors.textMuted}
              value={bioInput}
              onChangeText={setBioInput}
              maxLength={150}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.charCount}>{bioInput.length} / 150</Text>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveBio}
              disabled={savingBio}
            >
              {savingBio ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: 16 },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  banner: {
    width: '100%',
    height: 100,
  },
  avatarWrapper: {
    marginTop: -45,
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: colors.card,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  cameraPill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bioText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  bioPlaceholder: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.busyLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutBtnText: {
    color: colors.busy,
    fontWeight: '700',
    fontSize: 15,
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
  bioInput: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});

