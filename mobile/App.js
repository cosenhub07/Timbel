import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import MainNavigator from './src/navigation/MainNavigator';
import AIAssistantWidget from './src/components/AIAssistantWidget';
import { colors } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer>
              <View style={styles.innerContainer}>
                <MainNavigator />
                {/* Floating Gemini AI Assistant */}
                <AIAssistantWidget />
                <StatusBar style="light" backgroundColor={colors.surface} />
              </View>
            </NavigationContainer>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
