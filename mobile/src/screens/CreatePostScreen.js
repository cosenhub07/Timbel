import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { ArrowLeft, Plus, X, Users, Heart, Sparkles } from 'lucide-react-native';
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

export default function CreatePostScreen({ navigation }) {
  const { user, profile, selectedCampus } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [connectionType, setConnectionType] = useState('Individual'); // 'Individual' | 'Group'
  const [preferredGender, setPreferredGender] = useState('Any'); // 'Any' | 'Male' | 'Female'
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedAnimation, setSelectedAnimation] = useState('anim7');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [maxGroupSize, setMaxGroupSize] = useState('10');
  const [creating, setCreating] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title for your request.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a description.');
      return;
    }

    setCreating(true);
    try {
      const displayName = isAnonymous ? 'Anonymous' : profile?.name || 'Someone';

      const { error } = await supabase.from('sendiyou_posts').insert([
        {
          creator_id: user.id,
          campus_id: selectedCampus?.id || null,
          title: title.trim(),
          description: description.trim(),
          connection_type: connectionType,
          preferred_gender: preferredGender,
          is_anonymous: isAnonymous,
          display_name: displayName,
          selected_animation: selectedAnimation,
          tags,
          max_group_size:
            connectionType === 'Group'
              ? Math.min(50, Math.max(2, parseInt(maxGroupSize, 10) || 10))
              : null,
        },
      ]);

      if (error) throw error;

      Alert.alert('Success ✨', 'Your connection post is live!', [
        {
          text: 'Great',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error creating post:', err);
      Alert.alert('Error', err.message || 'Failed to create post.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Create Request" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.label}>
          Title <Text style={{ color: colors.busy }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Study buddy for Operating Systems"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        {/* Description */}
        <Text style={styles.label}>
          Description <Text style={{ color: colors.busy }}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell others what you're looking for or trying to accomplish..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={300}
        />

        {/* Connection Type */}
        <Text style={styles.label}>Connection Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeCard, connectionType === 'Individual' && styles.typeCardActive]}
            onPress={() => setConnectionType('Individual')}
          >
            <Heart size={20} color={connectionType === 'Individual' ? colors.primary : colors.textMuted} />
            <Text style={[styles.typeCardTitle, connectionType === 'Individual' && styles.typeCardTitleActive]}>
              1-on-1
            </Text>
            <Text style={styles.typeCardDesc}>Direct private chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeCard, connectionType === 'Group' && styles.typeCardActive]}
            onPress={() => setConnectionType('Group')}
          >
            <Users size={20} color={connectionType === 'Group' ? colors.primary : colors.textMuted} />
            <Text style={[styles.typeCardTitle, connectionType === 'Group' && styles.typeCardTitleActive]}>
              Group
            </Text>
            <Text style={styles.typeCardDesc}>Shared room chat</Text>
          </TouchableOpacity>
        </View>

        {/* Preferred Gender */}
        <Text style={styles.label}>Who can connect?</Text>
        <View style={styles.pillsRow}>
          {['Any', 'Male', 'Female'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[styles.genderPill, preferredGender === gender && styles.genderPillActive]}
              onPress={() => setPreferredGender(gender)}
            >
              <Text
                style={[
                  styles.genderPillText,
                  preferredGender === gender && styles.genderPillTextActive,
                ]}
              >
                {gender === 'Any' ? 'Everyone' : `${gender} Only`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anonymous Toggle */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Stay Anonymous</Text>
            <Text style={styles.switchSub}>
              {isAnonymous ? 'Your name & profile are hidden' : 'Your real name is shown'}
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.card, true: colors.primary }}
          />
        </View>

        {/* Animation Picker */}
        <Text style={styles.label}>Choose Post Animation</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animScroll}>
          {ANIMATION_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.animCard,
                selectedAnimation === key && styles.animCardActive,
              ]}
              onPress={() => setSelectedAnimation(key)}
            >
              <LottieView
                source={ANIMATIONS[key]}
                autoPlay
                loop
                style={{ width: 50, height: 50 }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tags */}
        <Text style={styles.label}>Tags (Optional, max 5)</Text>
        <View style={styles.tagInputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Add tag (e.g. coding, badminton)..."
            placeholderTextColor={colors.textMuted}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
          />
          <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
            <Plus size={18} color={colors.white} />
          </TouchableOpacity>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>#{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <X size={12} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCreate}
          disabled={creating}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Publish Request 🚀</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  typeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeCardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  typeCardTitleActive: { color: colors.primary },
  typeCardDesc: { fontSize: 11, color: colors.textMuted },
  pillsRow: { flexDirection: 'row', gap: 8 },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  genderPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderPillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  genderPillTextActive: { color: colors.white },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  switchSub: { fontSize: 11, color: colors.textMuted },
  animScroll: { marginVertical: 4 },
  animCard: {
    width: 66,
    height: 66,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  animCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  tagInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addTagBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  submitBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});

