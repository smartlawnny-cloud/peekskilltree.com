import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { formatTime, today as getToday } from '../utils/date';
import { currency } from '../utils/format';
import type { Job } from '../models/types';

// Demo data until Supabase is wired up
const DEMO_JOBS: Job[] = [
  {
    id: '1',
    jobNumber: 315,
    clientId: 'c1',
    clientName: 'Brian Heermance',
    property: '7 Lynwood Court, Cortlandt Manor, NY',
    description: 'Pruning - 3 oaks',
    scheduledDate: getToday(),
    status: 'scheduled',
    total: 1800,
    crew: ['Doug Brown', 'Ryan Knapp'],
  },
  {
    id: '2',
    jobNumber: 316,
    clientId: 'c2',
    clientName: 'Marlene Colangelo',
    property: '25 Oak Drive, Peekskill, NY',
    description: 'Tree removal - dead ash',
    scheduledDate: getToday(),
    status: 'in_progress',
    total: 3200,
    crew: ['Doug Brown', 'Catherine Conway'],
  },
];

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  late: 'error',
};

export function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const jobs = DEMO_JOBS;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleClockIn = () => {
    setClockedIn(true);
    setClockInTime(new Date().toISOString());
  };

  const handleClockOut = () => {
    setClockedIn(false);
    setClockInTime(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Branch Manager</Text>
          <Text style={styles.headerSub}>Second Nature Tree Service</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn}>
          <Avatar name="Doug Brown" size={36} color={colors.white + '30'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.greenDark} />}
      >
        {/* Clock In/Out Card */}
        <Card style={styles.clockCard}>
          <View style={styles.clockHeader}>
            <Text style={styles.clockEmoji}>⏰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.clockTitle}>
                {clockedIn ? 'Clocked In' : 'Ready to Work'}
              </Text>
              {clockedIn && clockInTime && (
                <Text style={styles.clockSince}>
                  Since {formatTime(clockInTime)}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.clockBtn, clockedIn ? styles.clockOutBtn : styles.clockInBtn]}
            onPress={clockedIn ? handleClockOut : handleClockIn}
            activeOpacity={0.8}
          >
            <Text style={styles.clockBtnText}>
              {clockedIn ? '⏹  Clock Out' : '▶  Clock In'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Today's Jobs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Jobs</Text>
          <Text style={styles.sectionCount}>{jobs.length}</Text>
        </View>

        {jobs.map(job => (
          <TouchableOpacity
            key={job.id}
            activeOpacity={0.7}
            onPress={() => {/* navigation.navigate('JobDetail', { id: job.id }) */}}
          >
            <Card style={styles.jobCard}>
              <View style={styles.jobTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobNumber}>#{job.jobNumber}</Text>
                  <Text style={styles.jobClient}>{job.clientName}</Text>
                  <Text style={styles.jobAddress} numberOfLines={1}>{job.property}</Text>
                </View>
                <View style={styles.jobRight}>
                  <StatusBadge
                    label={job.status.replace('_', ' ')}
                    variant={STATUS_VARIANT[job.status] || 'neutral'}
                  />
                  <Text style={styles.jobTotal}>{currency(job.total)}</Text>
                </View>
              </View>

              {job.description && (
                <Text style={styles.jobDesc}>{job.description}</Text>
              )}

              <View style={styles.crewRow}>
                {job.crew.map((c, i) => (
                  <View key={i} style={styles.crewChip}>
                    <Text style={styles.crewChipText}>{c.split(' ')[0]}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Quick Stats */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Jobs Today</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>$5,000</Text>
            <Text style={styles.statLabel}>Today's Value</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Crew Members</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.red }]}>3</Text>
            <Text style={styles.statLabel}>Unpaid Invoices</Text>
          </Card>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.greenDark,
  },
  header: {
    backgroundColor: colors.greenDark,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + spacing.md : spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.white,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.white + '99',
    marginTop: 2,
  },
  avatarBtn: {
    opacity: 0.8,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  content: {
    padding: spacing.lg,
  },
  clockCard: {
    marginBottom: spacing.lg,
  },
  clockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  clockEmoji: {
    fontSize: 32,
  },
  clockTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  clockSince: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clockBtn: {
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  clockInBtn: {
    backgroundColor: colors.greenDark,
  },
  clockOutBtn: {
    backgroundColor: colors.red,
  },
  clockBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  jobCard: {
    marginBottom: spacing.sm,
  },
  jobTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jobNumber: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
  },
  jobClient: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  jobAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  jobRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  jobTotal: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  jobDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  crewRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  crewChip: {
    backgroundColor: colors.greenBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  crewChipText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.greenDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 4,
  },
});
