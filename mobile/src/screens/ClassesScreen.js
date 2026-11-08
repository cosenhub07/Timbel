import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { Search, Calendar, Clock, User, MapPin, ChevronDown, GraduationCap, BookOpen } from 'lucide-react-native';
import Header from '../components/Header';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function ClassesScreen({ navigation }) {
  const { selectedCampus } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClasses();
  }, [selectedCampus]);

  useEffect(() => {
    if (!selectedClass) {
      setScheduleData(null);
      return;
    }
    loadSchedule();
  }, [selectedClass, selectedCampus]);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const data = await apiFetch(`/api/timetable/classes${campusParam}`);
      setClasses(data.classes || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadSchedule = async () => {
    setLoadingSchedule(true);
    try {
      let url = `/api/timetable/classes/${encodeURIComponent(selectedClass)}`;
      if (selectedCampus?.id) url += `?campus_id=${selectedCampus.id}`;
      const data = await apiFetch(url);
      if (data.schedule) {
        const grouped = {};
        DAYS_OF_WEEK.forEach((d) => (grouped[d] = []));
        data.schedule.forEach((slot) => {
          const dayKey = slot.day?.toUpperCase().substring(0, 3);
          if (grouped[dayKey]) grouped[dayKey].push(slot);
        });
        setScheduleData(grouped);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load schedule');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter((c) => c.toLowerCase().includes(q));
  }, [classes, searchQuery]);

  const daysToShow = selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay];

  const renderScheduleSlot = (slot, idx) => (
    <View key={idx} style={styles.slotCard}>
      <View style={styles.slotTimeCol}>
        <Text style={styles.slotTimeStart}>{slot.start_time}</Text>
        <Text style={styles.slotTimeEnd}>{slot.end_time}</Text>
      </View>
      <View style={styles.slotDivider} />
      <View style={styles.slotInfoCol}>
        <Text style={styles.slotSubject} numberOfLines={2}>
          {slot.subject}
        </Text>
        <View style={styles.slotDetailRow}>
          <MapPin size={12} color={colors.primary} />
          <Text style={styles.slotDetail}>{slot.room || 'TBA'}</Text>
        </View>
        <View style={styles.slotDetailRow}>
          <User size={12} color={colors.primaryHover} />
          <Text style={styles.slotDetail}>{slot.teacher || 'TBA'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Class Timetables" />

      {/* Class Selector */}
      <View style={styles.selectorContainer}>
        <TouchableOpacity
          style={styles.classSelector}
          onPress={() => setShowClassPicker(true)}
          activeOpacity={0.7}
        >
          <BookOpen size={18} color={selectedClass ? colors.primary : colors.textMuted} />
          <Text
            style={[
              styles.classSelectorText,
              !selectedClass && styles.classSelectorPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedClass || 'Select your class...'}
          </Text>
          <ChevronDown size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Teacher Status link */}
        <TouchableOpacity
          style={styles.teacherLink}
          onPress={() => navigation.navigate('Teachers')}
          activeOpacity={0.7}
        >
          <GraduationCap size={16} color={colors.primary} />
          <Text style={styles.teacherLinkText}>Teacher Status →</Text>
        </TouchableOpacity>
      </View>

      {/* Day Filter Chips */}
      {scheduleData && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayChipsScroll}
        >
          <TouchableOpacity
            style={[styles.dayChip, selectedDay === 'ALL' && styles.dayChipActive]}
            onPress={() => setSelectedDay('ALL')}
          >
            <Text style={[styles.dayChipText, selectedDay === 'ALL' && styles.dayChipTextActive]}>
              ALL
            </Text>
          </TouchableOpacity>
          {DAYS_OF_WEEK.map((d) => {
            const hasClasses = scheduleData[d]?.length > 0;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selectedDay === d && styles.dayChipTextActive,
                    !hasClasses && styles.dayChipTextEmpty,
                  ]}
                >
                  {d}
                </Text>
                {hasClasses && <View style={styles.dayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Content */}
      {loadingSchedule ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      ) : !selectedClass ? (
        <View style={styles.centerContainer}>
          <Calendar size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Select Your Class</Text>
          <Text style={styles.emptySub}>
            Choose your class code above to view your weekly schedule
          </Text>
        </View>
      ) : scheduleData ? (
        <ScrollView contentContainerStyle={styles.scheduleContent} showsVerticalScrollIndicator={false}>
          {daysToShow.map((day) => {
            const slots = scheduleData[day] || [];
            if (slots.length === 0 && selectedDay !== 'ALL') {
              return (
                <View key={day} style={styles.emptyDayContainer}>
                  <Text style={styles.emptyDayText}>No lectures on {day}</Text>
                </View>
              );
            }
            if (slots.length === 0) return null;
            return (
              <View key={day} style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Calendar size={14} color={colors.primary} />
                  <Text style={styles.dayHeaderText}>{day}</Text>
                  <View style={styles.dayCountPill}>
                    <Text style={styles.dayCountText}>{slots.length}</Text>
                  </View>
                </View>
                {slots.map((slot, idx) => renderScheduleSlot(slot, idx))}
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : null}

      {/* Class Picker Modal */}
      <Modal visible={showClassPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => { setShowClassPicker(false); setSearchQuery(''); }}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search classes..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
            {loadingClasses ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : (
              <FlatList
                data={filteredClasses}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.classItem,
                      selectedClass === item && styles.classItemActive,
                    ]}
                    onPress={() => {
                      setSelectedClass(item);
                      setShowClassPicker(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text
                      style={[
                        styles.classItemText,
                        selectedClass === item && styles.classItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noClassesText}>No classes found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  selectorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
  },
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  classSelectorPlaceholder: { color: colors.textMuted, fontWeight: '400' },
  teacherLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 91, 255, 0.3)',
  },
  teacherLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  dayChipsScroll: {
    paddingHorizontal: spacing.lg,
    gap: 6,
    paddingBottom: spacing.sm,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayChipTextActive: { color: colors.white },
  dayChipTextEmpty: { color: colors.textMuted },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  scheduleContent: {
    padding: spacing.md,
  },
  daySection: { marginBottom: spacing.lg },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  dayCountPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dayCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTimeCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotTimeStart: { fontSize: 14, fontWeight: '700', color: colors.text },
  slotTimeEnd: { fontSize: 11, color: colors.textMuted },
  slotDivider: {
    width: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginHorizontal: spacing.md,
  },
  slotInfoCol: { flex: 1, gap: 4 },
  slotSubject: { fontSize: 14, fontWeight: '600', color: colors.text },
  slotDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotDetail: { fontSize: 12, color: colors.textSecondary },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.xl,
  },
  loadingText: { fontSize: 13, color: colors.textSecondary },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  emptyDayContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyDayText: { fontSize: 14, color: colors.textMuted },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalClose: { fontSize: 15, fontWeight: '600', color: colors.primary },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  classItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  classItemActive: {
    backgroundColor: colors.primaryLight,
  },
  classItemText: { fontSize: 15, color: colors.text },
  classItemTextActive: { color: colors.primary, fontWeight: '700' },
  noClassesText: {
    textAlign: 'center',
    paddingVertical: 30,
    color: colors.textMuted,
    fontSize: 14,
  },
});
