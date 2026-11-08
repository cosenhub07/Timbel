import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Search, School, Check, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

export default function LoginScreen({ navigation }) {
  const {
    campuses,
    selectedCampus: currentSavedCampus,
    setSelectedCampus: saveGlobalCampus,
    signInWithGoogle,
    authError,
    setAuthError,
  } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [pickedCampus, setPickedCampus] = useState(currentSavedCampus || null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const filteredCampuses = useMemo(() => {
    if (!campuses) return [];
    if (!searchQuery.trim()) return campuses;
    const query = searchQuery.toLowerCase();
    return campuses.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.short_name?.toLowerCase().includes(query)
    );
  }, [campuses, searchQuery]);

  const handleEnterNativeApp = async () => {
    if (!pickedCampus) return;
    if (setAuthError) setAuthError('');
    await saveGlobalCampus(pickedCampus);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleGoogleSignIn = async () => {
    if (!pickedCampus) return;
    if (setAuthError) setAuthError('');
    setIsSigningIn(true);
    try {
      await signInWithGoogle(pickedCampus);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const renderCampusItem = ({ item }) => {
    const isSelected = pickedCampus?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.campusCard, isSelected && styles.campusCardSelected]}
        onPress={() => setPickedCampus(item)}
        activeOpacity={0.7}
      >
        <View style={styles.campusInfo}>
          <Text style={[styles.campusShort, isSelected && styles.campusShortSelected]}>
            {item.short_name}
          </Text>
          <Text style={styles.campusName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
          {isSelected && <Check size={14} color={colors.white} strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top bar with back */}
      <View style={styles.topNav}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.topNavTitle}>Select Your Campus</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <School size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Welcome to Timbel</Text>
          <Text style={styles.subtitle}>
            Select your university campus below to access real-time classrooms, timetables, and SendiYou
          </Text>
        </View>

        {/* Error notification */}
        {authError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={colors.busy} />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search university / college..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Campuses List */}
        <FlatList
          data={filteredCampuses}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderCampusItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No campuses found matching search</Text>
            </View>
          }
        />

        {/* Bottom Action Footer */}
        <View style={styles.footer}>
          {/* Direct Native App Entry Button */}
          <TouchableOpacity
            style={[
              styles.signInBtn,
              !pickedCampus && styles.signInBtnDisabled,
            ]}
            onPress={handleEnterNativeApp}
            disabled={!pickedCampus}
            activeOpacity={0.8}
          >
            <Text style={styles.signInBtnText}>
              {pickedCampus
                ? `Continue to App (${pickedCampus.short_name})`
                : 'Select a University First'}
            </Text>
            {pickedCampus && <ArrowRight size={18} color={colors.white} />}
          </TouchableOpacity>

          {/* Optional Google OAuth Sign In */}
          {pickedCampus && (
            <TouchableOpacity
              style={styles.googleSecondaryBtn}
              onPress={handleGoogleSignIn}
              disabled={isSigningIn}
              activeOpacity={0.8}
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.googleSecondaryBtnText}>
                  Or Sign in with Google ({pickedCampus.short_name})
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.busyLight,
    borderWidth: 1,
    borderColor: colors.busy,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.busy,
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: 8,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
    gap: 8,
  },
  campusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  campusCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  campusInfo: {
    flex: 1,
    paddingRight: 10,
  },
  campusShort: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  campusShortSelected: {
    color: colors.primaryHover,
  },
  campusName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  footer: {
    paddingVertical: spacing.md,
    gap: 10,
  },
  signInBtn: {
    height: 50,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnDisabled: {
    backgroundColor: colors.cardSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  signInBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  googleSecondaryBtn: {
    height: 44,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleSecondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
