import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Building2, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react-native';
import Header from '../components/Header';
import RoomCard from '../components/RoomCard';
import AIAssistantWidget from '../components/AIAssistantWidget';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function FinderScreen() {
  const { selectedCampus } = useAuth();
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [roomsData, setRoomsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'free', 'in-use'

  // Initialize time & fetch buildings
  useEffect(() => {
    syncCurrentTime();
    loadBuildings();
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedBuilding && selectedDay && selectedTime) {
      loadRooms();
    }
  }, [selectedBuilding, selectedDay, selectedTime, selectedCampus]);

  const syncCurrentTime = () => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    let currentDay = days[now.getDay()];
    if (currentDay === 'SUN') currentDay = 'MON';
    setSelectedDay(currentDay);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  };

  const loadBuildings = async () => {
    try {
      setError(null);
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const data = await apiFetch(`/api/timetable/buildings${campusParam}`);
      const bList = data.buildings || [];
      setBuildings(bList);

      const saved = await AsyncStorage.getItem('last_building');
      if (saved && bList.includes(saved)) {
        setSelectedBuilding(saved);
      } else if (bList.length > 0) {
        setSelectedBuilding(bList[0]);
      }
    } catch (err) {
      console.error('Failed to load buildings:', err);
      setError('Could not connect to campus timetable server');
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/timetable/rooms?building=${encodeURIComponent(selectedBuilding)}&day=${selectedDay}&time=${selectedTime}`;
      if (selectedCampus?.id) url += `&campus_id=${selectedCampus.id}`;
      const data = await apiFetch(url);
      setRoomsData(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError('Could not retrieve room statuses. Please pull to refresh.');
      setRoomsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBuilding = async (b) => {
    setSelectedBuilding(b);
    await AsyncStorage.setItem('last_building', b);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    syncCurrentTime();
    await loadRooms();
    setRefreshing(false);
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!roomsData?.rooms) return [];
    if (statusFilter === 'free') {
      return roomsData.rooms.filter((r) => r.status === 'free');
    }
    if (statusFilter === 'in-use') {
      return roomsData.rooms.filter((r) => r.status === 'in-use');
    }
    return roomsData.rooms;
  }, [roomsData, statusFilter]);

  const stats = useMemo(() => {
    const list = roomsData?.rooms || [];
    const freeCount = list.filter((r) => r.status === 'free').length;
    const occupiedCount = list.filter((r) => r.status === 'in-use').length;
    const soonCount = list.filter((r) => r.status === 'busy-soon').length;
    return { free: freeCount, occupied: occupiedCount, soon: soonCount, total: list.length };
  }, [roomsData]);

  return (
    <View style={styles.container}>
      <Header title="Class Status" />

      {/* Buildings Horizontal Chip Selector */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {buildings.map((b) => {
            const isSelected = selectedBuilding === b;
            return (
              <TouchableOpacity
                key={b}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleSelectBuilding(b)}
                activeOpacity={0.7}
              >
                <Building2
                  size={14}
                  color={isSelected ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Days Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {DAYS.map((d) => {
            const isSelected = selectedDay === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Quick Summary Pill Bar */}
      {roomsData && (
        <View style={styles.summaryBar}>
          <TouchableOpacity
            style={[styles.statPill, statusFilter === 'all' && styles.statPillActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={styles.statPillText}>All ({stats.total})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statPill,
              styles.statPillFree,
              statusFilter === 'free' && styles.statPillFreeActive,
            ]}
            onPress={() => setStatusFilter('free')}
          >
            <Text style={[styles.statPillText, { color: colors.free }]}>
              Vacant ({stats.free})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statPill,
              styles.statPillBusy,
              statusFilter === 'in-use' && styles.statPillBusyActive,
            ]}
            onPress={() => setStatusFilter('in-use')}
          >
            <Text style={[styles.statPillText, { color: colors.busy }]}>
              Occupied ({stats.occupied})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Room Status List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingMsg}>Scanning real-time room occupancies...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={36} color={colors.busy} />
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRooms}>
            <RefreshCw size={14} color={colors.white} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <RoomCard room={item} isToday={true} selectedDay={selectedDay} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Classrooms Found</Text>
              <Text style={styles.emptySub}>
                Try selecting a different building or time slot
              </Text>
            </View>
          }
        />
      )}

      {/* Floating AI Helper */}
      <AIAssistantWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
    marginBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  daysScroll: {
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardSecondary,
  },
  dayChipActive: {
    backgroundColor: colors.primaryHover,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTextActive: {
    color: colors.white,
  },
  summaryBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
    backgroundColor: 'rgba(6, 12, 32, 0.4)',
  },
  statPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statPillFree: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statPillFreeActive: {
    backgroundColor: colors.freeLight,
    borderColor: colors.free,
  },
  statPillBusy: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statPillBusyActive: {
    backgroundColor: colors.busyLight,
    borderColor: colors.busy,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  loadingMsg: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorMsg: {
    fontSize: 13,
    color: colors.busy,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
  },
});

