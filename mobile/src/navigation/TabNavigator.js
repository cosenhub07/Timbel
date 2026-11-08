import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, Calendar, Plus, BarChart2, Heart } from 'lucide-react-native';

import FinderScreen from '../screens/FinderScreen';
import ClassesScreen from '../screens/ClassesScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import SendiYouScreen from '../screens/SendiYouScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import { colors, borderRadius } from '../theme';

const Tab = createBottomTabNavigator();

// Custom FAB Button component for center "Post" action
function CustomFabButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.fabCircle}>
        <Plus size={26} color={colors.white} strokeWidth={2.8} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Finder"
        component={FinderScreen}
        options={{
          tabBarLabel: 'Class Status',
          tabBarIcon: ({ color, size }) => <Search size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="Classes"
        component={ClassesScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ color, size }) => <Calendar size={20} color={color} />,
        }}
      />

      {/* Center FAB Tab */}
      <Tab.Screen
        name="PostModal"
        component={CreatePostScreen}
        options={{
          tabBarLabel: 'Post',
          tabBarButton: (props) => <CustomFabButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <BarChart2 size={20} color={color} />,
        }}
      />

      <Tab.Screen
        name="SendiYou"
        component={SendiYouScreen}
        options={{
          tabBarLabel: 'SendiYou',
          tabBarIcon: ({ color, size }) => <Heart size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  fabContainer: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  fabCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

