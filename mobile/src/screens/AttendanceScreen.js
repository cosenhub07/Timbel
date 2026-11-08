import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  BarChart2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react-native';
import Header from '../components/Header';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius } from '../theme';

export default function AttendanceScreen({ navigation }) {
  const { user, selectedCampus } = useAuth();

  const [targetCriteria, setTargetCriteria] = useState(75);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stats calculation
  const calcStats = (present, absent, target) => {
    const total = present + absent;
    const currentPct = total > 0 ? (present / total) * 100 : 100;
    const targetFraction = target / 100;

    let safeBunks = 0;
    let requiredToAttend = 0;

    if (currentPct >= target) {
      safeBunks = Math.floor((present - targetFraction * total) / targetFraction);
    } else {
      requiredToAttend = Math.ceil((targetFraction * total - present) / (1 - targetFraction));
    }

    let status = 'SAFE';
    if (currentPct < target - 10) status = 'DANGER';
    else if (currentPct < target) status = 'WARNING';

    return {
      total,
      currentPct: currentPct.toFixed(1),
      safeBunks: Math.max(0, safeBunks),
      requiredToAttend: Math.max(0, requiredToAttend),
      status,
    };
  };

  useEffect(() => {
    loadClasses();
    loadDashboard();
  }, [user, selectedCampus]);

  const loadClasses = async () => {
    try {
      const campusParam = selectedCampus?.id ? `?campus_id=${selectedCampus.id}` : '';
      const data = await apiFetch(`/api/timetable/classes${campusParam}`);
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    if (!user) {
      setSubjects([
        { id: '1', subject: 'Data Structures', present: 18, absent: 4 },
        { id: '2', subject: 'Operating Systems', present: 14, absent: 5 },
        { id: '3', subject: 'Database Systems', present: 20, absent: 2 },
        { id: '4', subject: 'Computer Networks', present: 12, absent: 6 },
      ]);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch(`/api/attendance/dashboard?user_id=${user.id}`);
      if (data && data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
        if (data.required_percentage) setTargetCriteria(data.required_percentage);
      } else {
        // Mock default subjects if not set yet so user has a smooth initial experience
        setSubjects([
          { id: '1', subject: 'Data Structures', present: 18, absent: 4 },
          { id: '2', subject: 'Operating Systems', present: 14, absent: 5 },
          { id: '3', subject: 'Database Systems', present: 20, absent: 2 },
          { id: '4', subject: 'Computer Networks', present: 12, absent: 6 },
        ]);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      // Fallback subjects
      setSubjects([
        { id: '1', subject: 'Data Structures', present: 18, absent: 4 },
        { id: '2', subject: 'Operating Systems', present: 14, absent: 5 },
        { id: '3', subject: 'Database Systems', present: 20, absent: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCount = (idx, type, delta) => {
    setSubjects((prev) =>
      prev.map((sub, i) => {
        if (i !== idx) return sub;
        const current = sub[type] || 0;
        const nextVal = Math.max(0, current + delta);
        return { ...sub, [type]: nextVal };
      })
    );
  };

  const handleAddNewSubject = () => {
    Alert.prompt
      ? Alert.prompt('New Subject', 'Enter subject name:', (text) => {
          if (text && text.trim()) {
            setSubjects((prev) => [
              ...prev,
              { id: Date.now().toString(), subject: text.trim(), present: 0, absent: 0 },
            ]);
          }
        })
      : setSubjects((prev) => [
          ...prev,
          { id: Date.now().toString(), subject: `Subject ${prev.length + 1}`, present: 0, absent: 0 },
        ]);
  };

  // Overall attendance
  const totalPresent = subjects.reduce((sum, s) => sum + (s.present || 0), 0);
  const totalAbsent = subjects.reduce((sum, s) => sum + (s.absent || 0), 0);
  const overallStats = calcStats(totalPresent, totalAbsent, targetCriteria);

  return (
    <View style={styles.container}>
      <Header title="Attendance Planner" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overall Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Overall Attendance</Text>
              <Text style={styles.summaryPct}>{overallStats.currentPct}%</Text>
            </View>
            <View
              style={[
                styles.overallBadge,
                overallStats.status === 'SAFE' && styles.badgeSafe,
                overallStats.status === 'WARNING' && styles.badgeWarning,
                overallStats.status === 'DANGER' && styles.badgeDanger,
              ]}
            >
              {overallStats.status === 'SAFE' && <CheckCircle size={14} color={colors.free} />}
              {overallStats.status === 'WARNING' && (
                <AlertTriangle size={14} color={colors.soon} />
              )}
              {overallStats.status === 'DANGER' && <XCircle size={14} color={colors.busy} />}
              <Text
                style={[
                  styles.overallBadgeText,
                  overallStats.status === 'SAFE' && { color: colors.free },
                  overallStats.status === 'WARNING' && { color: colors.soon },
                  overallStats.status === 'DANGER' && { color: colors.busy },
                ]}
              >
                {overallStats.status}
              </Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Present</Text>
              <Text style={[styles.summaryStatVal, { color: colors.free }]}>{totalPresent}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Absent</Text>
              <Text style={[styles.summaryStatVal, { color: colors.busy }]}>{totalAbsent}</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>
                {overallStats.status === 'SAFE' ? 'Safe Bunks' : 'Must Attend'}
              </Text>
              <Text style={[styles.summaryStatVal, { color: colors.primary }]}>
                {overallStats.status === 'SAFE'
                  ? overallStats.safeBunks
                  : overallStats.requiredToAttend}
              </Text>
            </View>
          </View>
        </View>

        {/* Target criteria selector */}
        <View style={styles.criteriaRow}>
          <Text style={styles.criteriaLabel}>Target Criteria:</Text>
          <View style={styles.criteriaPills}>
            {[75, 80, 85].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={[styles.criteriaPill, targetCriteria === pct && styles.criteriaPillActive]}
                onPress={() => setTargetCriteria(pct)}
              >
                <Text
                  style={[
                    styles.criteriaPillText,
                    targetCriteria === pct && styles.criteriaPillTextActive,
                  ]}
                >
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subjects List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tracked Subjects ({subjects.length})</Text>
          <TouchableOpacity style={styles.addSubjectBtn} onPress={handleAddNewSubject}>
            <Plus size={14} color={colors.primary} />
            <Text style={styles.addSubjectText}>Add</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          subjects.map((sub, idx) => {
            const stats = calcStats(sub.present || 0, sub.absent || 0, targetCriteria);
            return (
              <View key={sub.id || idx} style={styles.subjectCard}>
                <View style={styles.subjectTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjectName} numberOfLines={1}>
                      {sub.subject}
                    </Text>
                    <Text style={styles.subjectSub}>
                      {sub.present} attended of {stats.total} total
                    </Text>
                  </View>

                  <View style={styles.subjectPctBadge}>
                    <Text style={styles.subjectPctText}>{stats.currentPct}%</Text>
                  </View>
                </View>

                {/* Steppers */}
                <View style={styles.stepperContainer}>
                  {/* Present Stepper */}
                  <View style={styles.stepperGroup}>
                    <Text style={styles.stepperLabel}>Attended</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateCount(idx, 'present', -1)}
                      >
                        <Minus size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepVal}>{sub.present}</Text>
                      <TouchableOpacity
                        style={[styles.stepBtn, { backgroundColor: colors.freeLight }]}
                        onPress={() => handleUpdateCount(idx, 'present', 1)}
                      >
                        <Plus size={14} color={colors.free} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Absent Stepper */}
                  <View style={styles.stepperGroup}>
                    <Text style={styles.stepperLabel}>Missed</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => handleUpdateCount(idx, 'absent', -1)}
                      >
                        <Minus size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.stepVal}>{sub.absent}</Text>
                      <TouchableOpacity
                        style={[styles.stepBtn, { backgroundColor: colors.busyLight }]}
                        onPress={() => handleUpdateCount(idx, 'absent', 1)}
                      >
                        <Plus size={14} color={colors.busy} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Recommendation pill */}
                <View style={styles.recRow}>
                  {stats.status === 'SAFE' ? (
                    <Text style={styles.recSafe}>
                      🎉 Safe to miss next {stats.safeBunks} lecture(s)
                    </Text>
                  ) : (
                    <Text style={styles.recDanger}>
                      ⚠️ Must attend next {stats.requiredToAttend} lecture(s) to reach{' '}
                      {targetCriteria}%
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: 14 },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  summaryPct: { fontSize: 32, fontWeight: '800', color: colors.text },
  overallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  badgeSafe: { backgroundColor: colors.freeLight },
  badgeWarning: { backgroundColor: colors.soonLight },
  badgeDanger: { backgroundColor: colors.busyLight },
  overallBadgeText: { fontSize: 12, fontWeight: '700' },
  summaryGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryStatLabel: { fontSize: 11, color: colors.textMuted },
  summaryStatVal: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  criteriaLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  criteriaPills: { flexDirection: 'row', gap: 6 },
  criteriaPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
  },
  criteriaPillActive: { backgroundColor: colors.primary },
  criteriaPillText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  criteriaPillTextActive: { color: colors.white },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.pill,
  },
  addSubjectText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  subjectCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  subjectTop: { flexDirection: 'row', alignItems: 'center' },
  subjectName: { fontSize: 15, fontWeight: '700', color: colors.text },
  subjectSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  subjectPctBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectPctText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  stepperContainer: { flexDirection: 'row', gap: 12 },
  stepperGroup: { flex: 1 },
  stepperLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.text },
  recRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recSafe: { fontSize: 11, color: colors.free, fontWeight: '600' },
  recDanger: { fontSize: 11, color: colors.busy, fontWeight: '600' },
});

