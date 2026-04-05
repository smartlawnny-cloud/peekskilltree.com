import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { currency } from '../utils/format';

interface WorkflowCard {
  icon: string;
  label: string;
  count: number;
  color: string;
  screen: string;
}

const WORKFLOW_CARDS: WorkflowCard[] = [
  { icon: '📥', label: 'Requests', count: 3, color: '#1565c0', screen: 'Search' },
  { icon: '📋', label: 'Quotes', count: 5, color: '#7c3aed', screen: 'Search' },
  { icon: '🔧', label: 'Jobs', count: 2, color: '#ea580c', screen: 'Schedule' },
  { icon: '💰', label: 'Invoices', count: 4, color: '#16a34a', screen: 'Search' },
];

const DEMO_TODAY_JOBS = [
  { id: '1', num: 315, client: 'Brian Heermance', desc: 'Pruning - 3 oaks', total: 1800, status: 'scheduled' },
  { id: '2', num: 316, client: 'Marlene Colangelo', desc: 'Tree removal - dead ash', total: 3200, status: 'in_progress' },
];

export function DashboardScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Workflow Cards */}
        <View style={styles.grid}>
          {WORKFLOW_CARDS.map(wc => (
            <TouchableOpacity
              key={wc.label}
              style={styles.workflowCard}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate(wc.screen)}
            >
              <Text style={styles.workflowIcon}>{wc.icon}</Text>
              <Text style={styles.workflowCount}>{wc.count}</Text>
              <Text style={styles.workflowLabel}>{wc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Jobs */}
        <Text style={styles.sectionTitle}>Today's Jobs</Text>
        {DEMO_TODAY_JOBS.map(job => (
          <Card key={job.id} style={styles.jobCard}>
            <View style={styles.jobTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobNum}>#{job.num}</Text>
                <Text style={styles.jobClient}>{job.client}</Text>
                <Text style={styles.jobDesc}>{job.desc}</Text>
              </View>
              <View style={styles.jobRight}>
                <StatusBadge
                  label={job.status.replace('_', ' ')}
                  variant={job.status === 'in_progress' ? 'warning' : 'info'}
                />
                <Text style={styles.jobTotal}>{currency(job.total)}</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Revenue Summary */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <Card>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>$5,000</Text>
              <Text style={styles.summaryLabel}>Scheduled</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>$154</Text>
              <Text style={styles.summaryLabel}>Receivables</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.greenDark }]}>$217</Text>
              <Text style={styles.summaryLabel}>Collected</Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  workflowCard: {
    width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  workflowIcon: { fontSize: 28 },
  workflowCount: { fontSize: fontSize.xxl, fontWeight: '800', marginTop: spacing.sm },
  workflowLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  jobCard: { marginBottom: spacing.sm },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between' },
  jobNum: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent },
  jobClient: { fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  jobDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobTotal: { fontSize: fontSize.md, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', gap: spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: fontSize.xl, fontWeight: '800' },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 4 },
});
