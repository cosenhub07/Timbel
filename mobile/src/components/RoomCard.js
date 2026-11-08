import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, User, ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react-native';
import StatusBadge from './StatusBadge';
import { colors, spacing, borderRadius } from '../theme';

export default function RoomCard({ room, isToday = true, selectedDay = '' }) {
  const [expanded, setExpanded] = useState(false);
  const { name, status, currentClass, nextClass, fullSchedule = [], isLab } = room;

  return (
    <View style={styles.card}>
      {/* Top Header: Room Name & Status */}
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Text style={styles.roomName}>{name}</Text>
          {isLab && (
            <View style={styles.labBadge}>
              <Text style={styles.labBadgeText}>🧪 Lab</Text>
            </View>
          )}
        </View>
        <StatusBadge status={status} />
      </View>

      {/* Main Status Information */}
      {status === 'in-use' && currentClass && (
        <View style={styles.infoBoxBusy}>
          <Text style={styles.boxLabelBusy}>Current Class</Text>
          <Text style={styles.subjectText} numberOfLines={1}>
            {currentClass.subject}
          </Text>
          <View style={styles.detailRow}>
            <Clock size={12} color={colors.primaryHover} />
            <Text style={styles.detailText}>
              {currentClass.start_time} - {currentClass.end_time}
            </Text>
          </View>
          {currentClass.teacher ? (
            <View style={styles.detailRow}>
              <User size={12} color={colors.primaryHover} />
              <Text style={styles.detailText}>{currentClass.teacher}</Text>
            </View>
          ) : null}
        </View>
      )}

      {(status === 'free' || status === 'busy-soon') && (
        <View style={styles.infoBoxFree}>
          {nextClass ? (
            <>
              <Text style={styles.boxLabelFree}>
                {status === 'busy-soon' ? 'Occupied Soon — Next Class:' : 'Vacant — Next Class:'}
              </Text>
              <Text style={styles.subjectText} numberOfLines={1}>
                {nextClass.subject}
              </Text>
              <View style={styles.detailRow}>
                <Clock size={12} color={colors.free} />
                <Text style={styles.detailText}>
                  Starts at {nextClass.start_time} (until {nextClass.end_time})
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyFreeBox}>
              <Text style={styles.allFreeText}>✨ Vacant for the rest of the day</Text>
            </View>
          )}
        </View>
      )}

      {status === 'concluded' && (
        <View style={styles.concludedBox}>
          <Text style={styles.concludedTitle}>🌙 Classes Concluded</Text>
          <Text style={styles.concludedSub}>College hours have ended for today.</Text>
        </View>
      )}

      {/* Schedule Accordion Toggle */}
      {fullSchedule && fullSchedule.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <View style={styles.expandLabelRow}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.expandButtonText}>
                {expanded ? 'Hide Schedule' : `View Full Schedule (${fullSchedule.length} lectures)`}
              </Text>
            </View>
            {expanded ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {expanded && (
            <View style={styles.scheduleList}>
              {fullSchedule.map((item, idx) => (
                <View key={idx} style={styles.scheduleItem}>
                  <View style={styles.scheduleTimeCol}>
                    <Text style={styles.scheduleTimeText}>{item.start_time}</Text>
                    <Text style={styles.scheduleTimeEnd}>{item.end_time}</Text>
                  </View>
                  <View style={styles.scheduleContentCol}>
                    <Text style={styles.scheduleSubject}>{item.subject}</Text>
                    <Text style={styles.scheduleTeacher}>
                      {item.teacher || 'TBA'} • Sec {item.section || 'All'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  labBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  labBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accentCyan,
  },
  infoBoxBusy: {
    backgroundColor: 'rgba(6, 12, 32, 0.6)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: spacing.sm,
  },
  boxLabelBusy: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.busy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoBoxFree: {
    backgroundColor: 'rgba(6, 12, 32, 0.6)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: spacing.sm,
  },
  boxLabelFree: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.free,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyFreeBox: {
    paddingVertical: 4,
  },
  allFreeText: {
    fontSize: 13,
    color: colors.free,
    fontWeight: '600',
  },
  concludedBox: {
    backgroundColor: 'rgba(6, 12, 32, 0.6)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  concludedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryHover,
    marginBottom: 2,
  },
  concludedSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.4)',
    marginTop: 4,
  },
  expandLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scheduleList: {
    paddingTop: 8,
    gap: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(6, 12, 32, 0.4)',
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  scheduleTimeCol: {
    width: 65,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  scheduleTimeEnd: {
    fontSize: 10,
    color: colors.textMuted,
  },
  scheduleContentCol: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleTeacher: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

