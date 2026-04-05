import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { SummaryCard } from '../components/SummaryCard';
import { ApprovalBadge } from '../components/ApprovalBadge';
import { currency, hours as fmtHours } from '../utils/format';

// Demo payroll data
const PAYROLL_EMPLOYEES = [
  { id: 'cc', name: 'Catherine Conway', role: 'Crew Lead', regular: 40, ot: 2, pto: 0, rate: 35, approved: true },
  { id: 'rk', name: 'Ryan Knapp', role: 'Crew Member', regular: 38, ot: 0, pto: 0, rate: 28, approved: true },
  { id: 'db', name: 'Doug Brown', role: 'Owner', regular: 45, ot: 5, pto: 0, rate: 0, approved: false },
];

export function PayrollReviewScreen({ navigation }: any) {
  const [employees] = useState(PAYROLL_EMPLOYEES);

  const totalRegular = employees.reduce((s, e) => s + e.regular, 0);
  const totalOT = employees.reduce((s, e) => s + e.ot, 0);
  const totalPTO = employees.reduce((s, e) => s + e.pto, 0);
  const totalGross = employees.reduce((s, e) => {
    const reg = Math.min(e.regular, 40) * e.rate;
    const ot = e.ot * e.rate * 1.5;
    return s + reg + ot;
  }, 0);
  const allApproved = employees.every(e => e.approved);
  const approvedCount = employees.filter(e => e.approved).length;

  const handleSubmit = () => {
    if (!allApproved) {
      Alert.alert('Cannot Submit', 'All employees must be approved before submitting payroll.');
      return;
    }
    Alert.alert(
      'Submit Payroll',
      `Submit payroll for ${employees.length} employees totaling ${currency(totalGross)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send to Gusto', onPress: () => Alert.alert('Sent to Gusto!') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payroll Review</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Period */}
        <Text style={styles.periodLabel}>Week of Mar 24 – Mar 30, 2026</Text>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Regular" value={fmtHours(totalRegular)} />
          <SummaryCard
            label="Overtime"
            value={fmtHours(totalOT)}
            color={totalOT > 0 ? '#d97706' : colors.text}
            bgColor={totalOT > 0 ? colors.orangeBg : colors.bg}
          />
          <SummaryCard label="PTO" value={fmtHours(totalPTO)} />
          <SummaryCard
            label="Gross"
            value={currency(totalGross)}
            color={colors.greenDark}
            bgColor={colors.greenBg}
          />
        </View>

        {/* Readiness */}
        <View style={[styles.readyBanner, allApproved ? styles.readyGreen : styles.readyYellow]}>
          <Text style={styles.readyIcon}>{allApproved ? '✅' : '⏳'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.readyTitle, { color: allApproved ? '#166534' : '#92400e' }]}>
              {allApproved ? 'Payroll Ready' : 'Payroll Not Ready'}
            </Text>
            <Text style={[styles.readySub, { color: allApproved ? '#166534' : '#92400e' }]}>
              {allApproved
                ? 'All hours approved. Ready to sync with Gusto.'
                : `${employees.length - approvedCount} employee(s) pending approval`}
            </Text>
          </View>
        </View>

        {/* Employee Breakdown */}
        <Text style={styles.sectionTitle}>Employee Breakdown</Text>

        {employees.map(emp => {
          const gross = (Math.min(emp.regular, 40) * emp.rate) + (emp.ot * emp.rate * 1.5);
          return (
            <Card key={emp.id} style={styles.empCard}>
              <View style={styles.empTop}>
                <Avatar name={emp.name} size={40} />
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empRole}>{emp.role}</Text>
                </View>
                <ApprovalBadge status={emp.approved ? 'approved' : 'pending'} />
              </View>

              <View style={styles.empGrid}>
                <View style={styles.empStat}>
                  <Text style={styles.empStatVal}>{emp.regular.toFixed(1)}</Text>
                  <Text style={styles.empStatLabel}>Regular</Text>
                </View>
                <View style={styles.empStat}>
                  <Text style={[styles.empStatVal, emp.ot > 0 && { color: '#d97706' }]}>
                    {emp.ot.toFixed(1)}
                  </Text>
                  <Text style={styles.empStatLabel}>OT</Text>
                </View>
                <View style={styles.empStat}>
                  <Text style={styles.empStatVal}>
                    {emp.rate > 0 ? currency(emp.rate) + '/hr' : '—'}
                  </Text>
                  <Text style={styles.empStatLabel}>Rate</Text>
                </View>
                <View style={styles.empStat}>
                  <Text style={[styles.empStatVal, { color: colors.greenDark }]}>
                    {emp.rate > 0 ? currency(gross) : '—'}
                  </Text>
                  <Text style={styles.empStatLabel}>Gross</Text>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !allApproved && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={allApproved ? 0.8 : 1}
        >
          <Text style={styles.submitText}>Send to Gusto</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  periodLabel: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    marginBottom: spacing.lg,
  },
  readyGreen: { backgroundColor: colors.greenBg, borderColor: colors.greenLight },
  readyYellow: { backgroundColor: colors.orangeBg, borderColor: colors.orange },
  readyIcon: { fontSize: 28 },
  readyTitle: { fontWeight: '700', fontSize: fontSize.md },
  readySub: { fontSize: fontSize.sm, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  empCard: { marginBottom: spacing.sm },
  empTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  empInfo: { flex: 1 },
  empName: { fontSize: fontSize.md, fontWeight: '700' },
  empRole: { fontSize: fontSize.sm, color: colors.textSecondary },
  empGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  empStat: { flex: 1, alignItems: 'center' },
  empStatVal: { fontSize: fontSize.md, fontWeight: '700' },
  empStatLabel: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 2 },
  submitBtn: {
    backgroundColor: colors.greenDark,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.white, fontSize: fontSize.lg, fontWeight: '800' },
});
