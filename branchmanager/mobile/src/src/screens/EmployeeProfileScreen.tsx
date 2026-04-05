import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { currency, phone as fmtPhone } from '../utils/format';

type TabKey = 'profile' | 'pay' | 'schedule' | 'history' | 'gusto';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'pay', label: 'Pay', icon: '💰' },
  { key: 'schedule', label: 'Schedule', icon: '📅' },
  { key: 'history', label: 'History', icon: '📋' },
  { key: 'gusto', label: 'Gusto', icon: '🔗' },
];

// Demo employee
const EMPLOYEE = {
  name: 'Catherine Conway',
  role: 'crew_lead',
  email: 'catherine@peekskilltree.com',
  phone: '9145550188',
  payRate: 35,
  startDate: '2024-06-15',
  ptoBalance: 5,
  ytdGross: 18200,
  ytdHours: 520,
  gustoId: null as string | null,
};

export function EmployeeProfileScreen({ navigation, route }: any) {
  const [tab, setTab] = useState<TabKey>('profile');
  const emp = EMPLOYEE;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee</Text>
        <TouchableOpacity>
          <Text style={styles.editBtn}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Summary */}
      <View style={styles.profileBanner}>
        <Avatar name={emp.name} size={64} color={colors.crewLead} />
        <Text style={styles.profileName}>{emp.name}</Text>
        <StatusBadge label={emp.role.replace('_', ' ')} variant="info" />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {tab === 'profile' && (
          <>
            <Card>
              <InfoRow label="Email" value={emp.email} />
              <InfoRow label="Phone" value={fmtPhone(emp.phone)} />
              <InfoRow label="Role" value={emp.role.replace('_', ' ')} />
              <InfoRow label="Start Date" value={emp.startDate} last />
            </Card>

            <Text style={styles.subTitle}>Permissions</Text>
            <Card>
              <PermRow label="View hours" allowed />
              <PermRow label="Edit hours" allowed />
              <PermRow label="Approve hours" allowed />
              <PermRow label="Add employees" denied />
              <PermRow label="Manage settings" denied last />
            </Card>
          </>
        )}

        {tab === 'pay' && (
          <>
            <Card>
              <View style={styles.payGrid}>
                <View style={styles.payItem}>
                  <Text style={styles.payValue}>{currency(emp.payRate)}/hr</Text>
                  <Text style={styles.payLabel}>Pay Rate</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payValue}>{emp.ptoBalance} days</Text>
                  <Text style={styles.payLabel}>PTO Balance</Text>
                </View>
              </View>
            </Card>

            <Text style={styles.subTitle}>Year to Date</Text>
            <Card>
              <View style={styles.payGrid}>
                <View style={styles.payItem}>
                  <Text style={styles.payValue}>{currency(emp.ytdGross)}</Text>
                  <Text style={styles.payLabel}>Gross Pay</Text>
                </View>
                <View style={styles.payItem}>
                  <Text style={styles.payValue}>{emp.ytdHours.toFixed(0)} hrs</Text>
                  <Text style={styles.payLabel}>Total Hours</Text>
                </View>
              </View>
            </Card>

            <Text style={styles.subTitle}>Recent Pay Stubs</Text>
            <Card>
              <PayStubRow period="Mar 24 – Mar 30" gross={1400} hours={40} />
              <PayStubRow period="Mar 17 – Mar 23" gross={1470} hours={42} />
              <PayStubRow period="Mar 10 – Mar 16" gross={1400} hours={40} last />
            </Card>
          </>
        )}

        {tab === 'schedule' && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Default Schedule</Text>
            <Text style={styles.emptyText}>Monday – Friday, 7:00 AM – 3:30 PM</Text>
          </Card>
        )}

        {tab === 'history' && (
          <>
            <Text style={styles.subTitle}>Recent Jobs</Text>
            <Card>
              <HistoryRow num={315} client="Brian Heermance" date="Mar 22" status="completed" />
              <HistoryRow num={312} client="Christina Eckhart" date="Mar 16" status="completed" />
              <HistoryRow num={308} client="Ken Phillips" date="Mar 10" status="completed" last />
            </Card>
          </>
        )}

        {tab === 'gusto' && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔗</Text>
            <Text style={styles.emptyTitle}>Gusto Integration</Text>
            <Text style={styles.emptyText}>
              {emp.gustoId ? `Synced — Gusto ID: ${emp.gustoId}` : 'Not synced with Gusto'}
            </Text>
            <TouchableOpacity style={styles.gustoBtn}>
              <Text style={styles.gustoBtnText}>
                {emp.gustoId ? 'Re-sync from Gusto' : 'Connect to Gusto'}
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[subs.infoRow, !last && subs.infoRowBorder]}>
      <Text style={subs.infoLabel}>{label}</Text>
      <Text style={subs.infoValue}>{value}</Text>
    </View>
  );
}

function PermRow({ label, allowed, denied, last }: { label: string; allowed?: boolean; denied?: boolean; last?: boolean }) {
  return (
    <View style={[subs.infoRow, !last && subs.infoRowBorder]}>
      <Text style={subs.infoLabel}>{label}</Text>
      <Text style={{ color: denied ? colors.red : colors.greenDark, fontWeight: '700', fontSize: fontSize.sm }}>
        {denied ? '✗ Denied' : '✓ Allowed'}
      </Text>
    </View>
  );
}

function PayStubRow({ period, gross, hours, last }: { period: string; gross: number; hours: number; last?: boolean }) {
  return (
    <View style={[subs.infoRow, !last && subs.infoRowBorder]}>
      <View>
        <Text style={subs.infoLabel}>{period}</Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.textLight }}>{hours} hrs</Text>
      </View>
      <Text style={{ fontWeight: '700', fontSize: fontSize.md }}>{currency(gross)}</Text>
    </View>
  );
}

function HistoryRow({ num, client, date, status, last }: { num: number; client: string; date: string; status: string; last?: boolean }) {
  return (
    <View style={[subs.infoRow, !last && subs.infoRowBorder]}>
      <View>
        <Text style={{ fontSize: fontSize.sm, fontWeight: '600' }}>#{num} {client}</Text>
        <Text style={{ fontSize: fontSize.xs, color: colors.textLight }}>{date}</Text>
      </View>
      <StatusBadge label={status} variant="success" />
    </View>
  );
}

const subs = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  editBtn: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  profileBanner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  profileName: { fontSize: fontSize.xl, fontWeight: '800', marginTop: spacing.sm },
  tabScroll: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.greenDark,
  },
  tabIcon: { fontSize: 14 },
  tabLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.greenDark },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  subTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  payGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  payItem: {
    flex: 1,
    alignItems: 'center',
  },
  payValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  payLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gustoBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.greenDark,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  gustoBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
