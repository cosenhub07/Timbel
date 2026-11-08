import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import ChatScreen from '../screens/ChatScreen';
import MessagesScreen from '../screens/MessagesScreen';
import TeachersScreen from '../screens/TeachersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  const { user, selectedCampus, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasEnteredApp = Boolean(user || selectedCampus);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {!hasEnteredApp ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Teachers" component={TeachersScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
