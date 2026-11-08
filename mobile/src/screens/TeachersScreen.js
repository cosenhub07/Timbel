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
} from 'react-native';
import { Search, Users, Clock, MapPin, BookOpen, Calendar, Moon } from 'lucide-react-native';
import Header from '../components/Header';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_FULL = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };

export default function TeachersScreen() {
  const { selectedCampus } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeachers();
    syncCurrentTime();
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedTeacher && selectedDay && selectedTime) {
      fetchTeacherStatus();
    }
  }, [selectedTeacher, selectedDay, selectedTime, selectedCampus]);

  const syncCurrentTime = () => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    setSelectedDay(days[now.getDay()]);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  };

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const data = await apiFetch(`/api/timetable/teachers${campusParam}`);
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error(err);
      setError('Could not load teachers list.');
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchTeacherStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/timetable/teachers/${encodeURIComponent(selectedTeacher)}/status?day=${selectedDay}&time=${selectedTime}`;
      if (selectedCampus?.id) url += `&campus_id=${selectedCampus.id}`;
      const data = await apiFetch(url);
      setTeacherData(data);
    } catch (err) {
      console.error(err);
      setError('Could not load status for this teacher.');
      setTeacherData(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!searchTerm.trim()) return teachers;
    return teachers.filter((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [teachers, searchTerm]);

  const todayDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const isToday = selectedDay === todayDay;

  const statusColor = (status) => {
    if (status === 'free') return { bg: colors.freeLight, border: colors.free, text: colors.free };
    if (status === 'in-lecture') return { bg: colors.busyLight, border: colors.busy, text: colors.busy };
    if (status === 'busy-soon') return { bg: colors.soonLight, border: colors.soon, text: colors.soon };
    return { bg: colors.primaryLight, border: colors.primary, text: colors.primary };
  };

  const renderStatusBanner = () => {
    if (!teacherData || !selectedTeacher) return null;

    if (selectedDay === 'SUN') {
      return (
        <View style={[styles.statusBanner, { backgroundColor: colors.primaryLight, borderColor: 'rgba(99,91,255,0.3)' }]}>
          <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>🏖️</Text>
          <Text style={styles.statusBannerTitle}>Sunday — Holiday!</Text>
          <Text style={styles.statusBannerSub}>No classes today. Enjoy your day!</Text>
        </View>
      );
    }

    if (!isToday) {
      return (
        <View style={[styles.statusBanner, { backgroundColor: colors.primaryLight, borderColor: 'rgba(99,91,255,0.3)' }]}>
          <View style={styles.statusIconCircle}>
            <Calendar size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statusBannerLabel, { color: colors.primary }]}>{DAY_FULL[selectedDay]} Timetable</Text>
          <Text style={styles.statusBannerTitle}>{teacherData.teacher}</Text>
          <Text style={styles.statusBannerSub}>
            {teacherData.todaySchedule?.length > 0
              ? `${teacherData.todaySchedule.length} lecture(s) on ${DAY_FULL[selectedDay]}`
              : `No lectures on ${DAY_FULL[selectedDay]}`}
          </Text>
        </View>
      );
    }

    if (teacherData.status === 'concluded') {
      return (
        <View style={[styles.statusBanner, { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.6)' }]}>
            <Moon size={24} color="#818CF8" />
          </View>
          <Text style={styles.statusBannerTitle}>{teacherData.teacher}</Text>
          <Text style={[styles.statusBannerSub, { color: '#818CF8' }]}>College Hours Concluded</Text>
        </View>
      );
    }

    const sc = statusColor(teacherData.status);
    const statusLabels = {
      'free': 'Currently Free',
      'in-lecture': 'In Lecture',
      'busy-soon': 'Free Now, Busy Soon',
    };

    return (
      <View style={[styles.statusBanner, { backgroundColor: sc.bg, borderColor: sc.border }]}>
        <View style={[styles.statusIconCircle, { backgroundColor: sc.bg, borderColor: sc.border }]}>
          {teacherData.status === 'free' && <Users size={24} color={sc.text} />}
          {teacherData.status === 'in-lecture' && <BookOpen size={24} color={sc.text} />}
          {teacherData.status === 'busy-soon' && <Clock size={24} color={sc.text} />}
        </View>
        <Text style={styles.statusBannerTitle}>{teacherData.teacher}</Text>
        <Text style={[styles.statusBannerLabel, { color: sc.text, fontSize: 15, fontWeight: '600' }]}>
          {statusLabels[teacherData.status] || 'Unknown'}
        </Text>

        {teacherData.status === 'in-lecture' && teacherData.currentClass && (
          <View style={styles.currentClassCard}>
            <View style={styles.currentClassRow}>
              <Text style={styles.currentClassLabel}>Subject</Text>
              <Text style={styles.currentClassValue}>{teacherData.currentClass.subject}</Text>
            </View>
            <View style={styles.currentClassRow}>
              <Text style={styles.currentClassLabel}>Class</Text>
              <Text style={styles.currentClassValue}>
                {teacherData.currentClass.class_code} {teacherData.currentClass.section}
              </Text>
            </View>
            <View style={styles.currentClassRow}>
              <Text style={styles.currentClassLabel}>Room</Text>
              <Text style={[styles.currentClassValue, { color: colors.primary }]}>
                Bldg {teacherData.currentClass.building}, {teacherData.currentClass.room}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Teacher Status" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Teacher Selector */}
        <TouchableOpacity style={styles.teacherSelector} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Search size={18} color={selectedTeacher ? colors.primary : colors.textMuted} />
          <Text style={[styles.teacherSelectorText, !selectedTeacher && styles.placeholderText]} numberOfLines={1}>
            {selectedTeacher || 'Search for a teacher...'}
          </Text>
        </TouchableOpacity>

        {/* Day Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipsScroll}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
              onPress={() => setSelectedDay(d)}
            >
              <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                {d}
              </Text>
              {d === todayDay && <View style={styles.todayDot} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.syncBtn} onPress={syncCurrentTime}>
            <Clock size={14} color={colors.primary} />
            <Text style={styles.syncBtnText}>Now</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Tracking location...</Text>
          </View>
        )}

        {/* Status Result */}
        {!loading && teacherData && selectedTeacher && (
          <View style={{ gap: 16 }}>
            {renderStatusBanner()}

            {/* Schedule Timeline */}
            {selectedDay !== 'SUN' && (
              <View style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.scheduleTitle}>Schedule for {selectedDay}</Text>
                </View>

                {teacherData.todaySchedule?.length > 0 ? (
                  teacherData.todaySchedule.map((slot, idx) => {
                    const isCurrent =
                      isToday &&
                      teacherData.currentClass &&
                      teacherData.currentClass.start_time === slot.start_time &&
                      teacherData.currentClass.room === slot.room;
                    return (
                      <View
                        key={idx}
                        style={[styles.slotCard, isCurrent && styles.slotCardCurrent]}
                      >
                        {isCurrent && <View style={styles.slotCurrentBar} />}
                        <View style={styles.slotTime}>
                          <Text style={styles.slotTimeText}>
                            {slot.start_time} - {slot.end_time}
                          </Text>
                        </View>
                        <View style={styles.slotInfo}>
                          <Text style={styles.slotSubject}>{slot.subject}</Text>
                          <Text style={styles.slotMeta}>
                            {slot.class_code} {slot.section} • {slot.session_type}
                          </Text>
                        </View>
                        <View style={styles.slotRoom}>
                          <MapPin size={13} color={colors.textSecondary} />
                          <Text style={styles.slotRoomText}>{slot.room}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.noSchedule}>
                    <BookOpen size={28} color={colors.textMuted} />
                    <Text style={styles.noScheduleText}>No classes on {selectedDay}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Empty initial state */}
        {!loading && !teacherData && !error && (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Search a Teacher</Text>
            <Text style={styles.emptySub}>Select a teacher above to check their live availability & schedule</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Teacher Picker Modal */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearchTerm(''); }}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearch}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Type a name..."
                placeholderTextColor={colors.textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoFocus
              />
            </View>
            {teachersLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            ) : (
              <FlatList
                data={filteredTeachers}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selectedTeacher === item && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedTeacher(item);
                      setShowPicker(false);
                      setSearchTerm('');
                    }}
                  >
                    <Users size={14} color={selectedTeacher === item ? colors.primary : colors.textMuted} />
                    <Text style={[styles.pickerItemText, selectedTeacher === item && styles.pickerItemTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultsText}>No teachers found</Text>
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
  scrollContent: { padding: spacing.lg },
  teacherSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  teacherSelectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  placeholderText: { color: colors.textMuted, fontWeight: '400' },
  dayChipsScroll: { gap: 6, paddingBottom: spacing.md },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  dayChipTextActive: { color: colors.white },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(99,91,255,0.3)',
  },
  syncBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  errorCard: {
    padding: spacing.md,
    backgroundColor: colors.busyLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 13, color: colors.busy },
  centerBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  loadingText: { fontSize: 13, color: colors.textMuted },
  statusBanner: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 4,
  },
  statusBannerLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  statusBannerTitle: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  statusBannerSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  currentClassCard: {
    marginTop: 12,
    backgroundColor: 'rgba(6,12,32,0.5)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    gap: 8,
  },
  currentClassRow: { flexDirection: 'row', justifyContent: 'space-between' },
  currentClassLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  currentClassValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  scheduleCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  scheduleTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 12,
    overflow: 'hidden',
  },
  slotCardCurrent: {
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(99,91,255,0.4)',
  },
  slotCurrentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  slotTime: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotTimeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  slotInfo: { flex: 1 },
  slotSubject: { fontSize: 14, fontWeight: '700', color: colors.text },
  slotMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  slotRoom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotRoomText: { fontSize: 12, fontWeight: '600', color: colors.text },
  noSchedule: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  noScheduleText: { fontSize: 14, color: colors.textMuted },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
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
  modalSearchInput: { flex: 1, color: colors.text, fontSize: 14 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemActive: { backgroundColor: colors.primaryLight },
  pickerItemText: { fontSize: 15, color: colors.text },
  pickerItemTextActive: { color: colors.primary, fontWeight: '700' },
  noResultsText: { textAlign: 'center', paddingVertical: 30, color: colors.textMuted, fontSize: 14 },
});

