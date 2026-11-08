import React, { createContext, useContext, useState, useEffect } from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { matchesCampusDomain } from '../utils/authUtils';

// Completes authentication session in browser
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

// Helper to safely parse hash/query params without relying on Hermes URL.hash
const extractParamsFromUrl = (url) => {
  if (!url) return {};
  const params = {};
  const hashPart = url.split('#')[1] || '';
  const queryPart = url.split('?')[1]?.split('#')[0] || '';
  const combined = [hashPart, queryPart].filter(Boolean).join('&');

  combined.split('&').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = decodeURIComponent(pair.slice(0, idx));
      const val = decodeURIComponent(pair.slice(idx + 1));
      params[key] = val;
    }
  });
  return params;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampusState] = useState(null);
  const [authError, setAuthError] = useState('');

  // Wrapper that persists selectedCampus to AsyncStorage
  const setSelectedCampus = async (campus) => {
    setSelectedCampusState(campus);
    try {
      if (campus) {
        await AsyncStorage.setItem('selected_campus', JSON.stringify(campus));
      } else {
        await AsyncStorage.removeItem('selected_campus');
      }
    } catch (e) {
      console.warn('Error saving selected campus:', e);
    }
  };

  // Load saved campus & campuses list on mount
  useEffect(() => {
    AsyncStorage.getItem('selected_campus')
      .then((saved) => {
        if (saved) {
          setSelectedCampusState(JSON.parse(saved));
        }
      })
      .catch(() => {});
    fetchCampuses();
  }, []);

  // Listen for deep links with auth tokens (e.g. from OAuth callback)
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event?.url;
      if (!url) return;
      const params = extractParamsFromUrl(url);
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => sub.remove();
  }, []);

  const fetchCampuses = async () => {
    try {
      const data = await apiFetch('/api/campuses');
      if (data && Array.isArray(data.campuses)) {
        setCampuses(data.campuses);
      } else if (Array.isArray(data)) {
        setCampuses(data);
      }
    } catch (err) {
      console.warn('Could not fetch campuses from API, falling back to supabase directly:', err.message);
      try {
        const { data: campusData } = await supabase.from('campuses').select('*');
        if (campusData) setCampuses(campusData);
      } catch (sbErr) {
        console.error('Supabase campuses fallback error:', sbErr);
      }
    }
  };

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          handleCampusAuth(session.user);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[Auth] getSession error, proceeding as unauthenticated:', err.message);
        setLoading(false);
      })
      .finally(() => {
        clearTimeout(safetyTimer);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        handleCampusAuth(session.user);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleCampusAuth = async (authUser) => {
    const pendingCampusStr = await AsyncStorage.getItem('pending_campus');
    if (pendingCampusStr) {
      try {
        const campus = JSON.parse(pendingCampusStr);
        if (matchesCampusDomain(authUser.email, campus.email_domains)) {
          await supabase
            .from('users')
            .update({ campus_id: campus.id })
            .eq('id', authUser.id);
          await AsyncStorage.removeItem('pending_campus');
          await setSelectedCampus(campus);
        } else {
          const userDomain = authUser.email?.split('@')[1] || '';
          setAuthError(
            `Your email domain (${userDomain}) does not match your selected campus (${campus.name}). Please sign in with your official college email.`
          );
          await signOut();
          await AsyncStorage.removeItem('pending_campus');
        }
      } catch (err) {
        console.error('Error handling campus auth:', err);
        await AsyncStorage.removeItem('pending_campus');
      }
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        if (data.campus_id) {
          const cachedCampus = campuses.find((c) => c.id === data.campus_id);
          if (cachedCampus) {
            await setSelectedCampus(cachedCampus);
          } else {
            const { data: campusRow } = await supabase
              .from('campuses')
              .select('*')
              .eq('id', data.campus_id)
              .maybeSingle();
            if (campusRow) await setSelectedCampus(campusRow);
          }
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (campus) => {
    try {
      setAuthError('');
      if (campus) {
        await AsyncStorage.setItem('pending_campus', JSON.stringify(campus));
        await setSelectedCampus(campus);
      }

      const redirectUrl = makeRedirectUri({
        scheme: 'timbel',
        path: 'auth/callback',
      });
      console.log('[Auth] OAuth Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No auth URL returned');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const params = extractParamsFromUrl(result.url);
        if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (err) {
      console.error('Sign in with Google error:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      setAuthError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setAuthError(err.message || 'Invalid email or password');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('pending_campus');
      await setSelectedCampus(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        campuses,
        selectedCampus,
        setSelectedCampus,
        authError,
        setAuthError,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        setProfile,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
