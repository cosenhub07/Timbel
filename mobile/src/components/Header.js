import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, MessageSquare, User, School } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { colors, spacing, borderRadius } from '../theme';

export default function Header({ title, showCampusSelector = true }) {
  const navigation = useNavigation();
  const { user, selectedCampus } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          style={styles.brandRow} 
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>{title || 'Timbel'}</Text>
            {selectedCampus ? (
              <View style={styles.campusBadge}>
                <School size={10} color={colors.primary} />
                <Text style={styles.campusName} numberOfLines={1}>
                  {selectedCampus.name || 'Campus'}
                </Text>
              </View>
            ) : (
              <Text style={styles.subTitle}>Campus Hub</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rightSection}>
        {user ? (
          <>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Messages')}
              activeOpacity={0.7}
            >
              <MessageSquare size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <Bell size={20} color={colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <User size={18} color={colors.white} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campusName: {
    fontSize: 10,
    color: colors.primaryHover,
    fontWeight: '600',
    maxWidth: 130,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.busy,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});

