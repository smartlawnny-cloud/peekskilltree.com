import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Avatar } from '../components/Avatar';
import { StatusBadge } from '../components/StatusBadge';
import { currency } from '../utils/format';

type Tab = 'all' | 'clients' | 'jobs' | 'invoices' | 'quotes' | 'requests';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'clients', label: 'Clients' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'requests', label: 'Requests' },
];

// Demo data — sorted by most recent
const DEMO_CLIENTS = [
  { id: '1', type: 'client' as const, name: 'Brian Heermance', address: '7 Lynwood Court, Cortlandt Manor, NY', phone: '(646) 228-4455', status: 'active', updatedAt: '2026-04-05' },
  { id: '2', type: 'client' as const, name: 'Ken Phillips', company: '130 BBQ', address: '130 Smith Street, Peekskill, NY', phone: '(914) 555-0102', status: 'active', updatedAt: '2026-04-04' },
  { id: '3', type: 'client' as const, name: 'Cynthia Ferral', address: '11 Piping Brook Lane, Bedford, NY', phone: '(347) 776-1419', status: 'lead', updatedAt: '2026-04-03' },
  { id: '4', type: 'client' as const, name: 'Christina Eckhart', address: '7 East Willow Street, Beacon, NY', phone: '(423) 740-1778', status: 'active', updatedAt: '2026-04-02' },
  { id: '5', type: 'client' as const, name: 'Marlene Colangelo', address: '25 Oak Drive, Peekskill, NY', phone: '(914) 555-0199', status: 'active', updatedAt: '2026-04-01' },
];

const DEMO_JOBS = [
  { id: 'j1', type: 'job' as const, num: 316, client: 'Marlene Colangelo', desc: 'Tree removal - dead ash', status: 'in_progress', total: 3200, updatedAt: '2026-04-05' },
  { id: 'j2', type: 'job' as const, num: 315, client: 'Brian Heermance', desc: 'Pruning - 3 oaks', status: 'scheduled', total: 1800, updatedAt: '2026-04-04' },
  { id: 'j3', type: 'job' as const, num: 312, client: 'Christina Eckhart', desc: 'Tree removal', status: 'late', total: 2500, updatedAt: '2026-03-16' },
];

const DEMO_INVOICES = [
  { id: 'i1', type: 'invoice' as const, num: 378, client: 'George Grant', subject: 'For Services Rendered', status: 'sent', total: 46, balance: 46, updatedAt: '2026-04-03' },
  { id: 'i2', type: 'invoice' as const, num: 377, client: 'Marlene Colangelo', subject: 'For Services Rendered', status: 'sent', total: 108, balance: 108, updatedAt: '2026-04-01' },
  { id: 'i3', type: 'invoice' as const, num: 376, client: 'Ken Phillips', subject: 'For Services Rendered', status: 'paid', total: 216.75, balance: 0, updatedAt: '2026-03-13' },
];

const DEMO_REQUESTS = [
  { id: 'r1', type: 'request' as const, client: 'Brian Heermance', address: '7 Lynwood Court, Cortlandt Manor, NY', source: 'Google Search', status: 'new', updatedAt: '2026-04-04' },
  { id: 'r2', type: 'request' as const, client: 'Cynthia Ferral', address: '11 Piping Brook Lane, Bedford, NY', source: 'Facebook', status: 'new', updatedAt: '2026-04-02' },
];

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success', lead: 'warning', scheduled: 'info', in_progress: 'warning',
  completed: 'success', late: 'error', sent: 'info', paid: 'success',
  overdue: 'error', new: 'info', draft: 'neutral',
};

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const q = query.toLowerCase().trim();

  const filteredClients = useMemo(() => {
    if (!q) return DEMO_CLIENTS;
    return DEMO_CLIENTS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }, [q]);

  const filteredJobs = useMemo(() => {
    if (!q) return DEMO_JOBS;
    return DEMO_JOBS.filter(j =>
      j.client.toLowerCase().includes(q) ||
      j.desc.toLowerCase().includes(q) ||
      String(j.num).includes(q)
    );
  }, [q]);

  const filteredInvoices = useMemo(() => {
    if (!q) return DEMO_INVOICES;
    return DEMO_INVOICES.filter(i =>
      i.client.toLowerCase().includes(q) ||
      String(i.num).includes(q)
    );
  }, [q]);

  const filteredRequests = useMemo(() => {
    if (!q) return DEMO_REQUESTS;
    return DEMO_REQUESTS.filter(r =>
      r.client.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }, [q]);

  const counts = {
    all: filteredClients.length + filteredJobs.length + filteredInvoices.length + filteredRequests.length,
    clients: filteredClients.length,
    jobs: filteredJobs.length,
    invoices: filteredInvoices.length,
    quotes: 0,
    requests: filteredRequests.length,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients, jobs, quotes..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, tab === t.key && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
                {t.label}
                {counts[t.key] > 0 ? ` (${counts[t.key]})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {counts.all} result{counts.all !== 1 ? 's' : ''}
          {q ? ` for "${query}"` : ' — most recent first'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Clients Section */}
        {(tab === 'all' || tab === 'clients') && filteredClients.length > 0 && (
          <Section title="Clients" icon="👥" count={filteredClients.length}>
            {filteredClients.map(c => (
              <TouchableOpacity key={c.id} activeOpacity={0.7} style={styles.resultRow}>
                <Avatar name={c.name} size={38} color={c.status === 'lead' ? colors.orange : colors.accent} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{c.name}</Text>
                  <Text style={styles.resultSub} numberOfLines={1}>{c.address}</Text>
                  {c.phone ? <Text style={styles.resultDetail}>{c.phone}</Text> : null}
                </View>
                <StatusBadge label={c.status} variant={STATUS_VARIANT[c.status] || 'neutral'} />
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {/* Jobs Section */}
        {(tab === 'all' || tab === 'jobs') && filteredJobs.length > 0 && (
          <Section title="Jobs" icon="🔧" count={filteredJobs.length}>
            {filteredJobs.map(j => (
              <TouchableOpacity key={j.id} activeOpacity={0.7} style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <View style={styles.resultTop}>
                    <Text style={styles.resultNum}>#{j.num}</Text>
                    <Text style={styles.resultName}>{j.client}</Text>
                  </View>
                  <Text style={styles.resultSub}>{j.desc}</Text>
                </View>
                <View style={styles.resultRight}>
                  <StatusBadge label={j.status.replace('_', ' ')} variant={STATUS_VARIANT[j.status] || 'neutral'} />
                  <Text style={styles.resultAmount}>{currency(j.total)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {/* Invoices Section */}
        {(tab === 'all' || tab === 'invoices') && filteredInvoices.length > 0 && (
          <Section title="Invoices" icon="💰" count={filteredInvoices.length}>
            {filteredInvoices.map(i => (
              <TouchableOpacity key={i.id} activeOpacity={0.7} style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <View style={styles.resultTop}>
                    <Text style={styles.resultNum}>#{i.num}</Text>
                    <Text style={styles.resultName}>{i.client}</Text>
                  </View>
                  <Text style={styles.resultSub}>{i.subject}</Text>
                </View>
                <View style={styles.resultRight}>
                  <StatusBadge label={i.status} variant={STATUS_VARIANT[i.status] || 'neutral'} />
                  <Text style={[styles.resultAmount, i.balance > 0 && { color: colors.red }]}>
                    {i.balance > 0 ? currency(i.balance) + ' due' : currency(i.total) + ' paid'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {/* Requests Section */}
        {(tab === 'all' || tab === 'requests') && filteredRequests.length > 0 && (
          <Section title="Requests" icon="📥" count={filteredRequests.length}>
            {filteredRequests.map(r => (
              <TouchableOpacity key={r.id} activeOpacity={0.7} style={styles.resultRow}>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{r.client}</Text>
                  <Text style={styles.resultSub} numberOfLines={1}>{r.address}</Text>
                  <Text style={styles.resultDetail}>{r.source}</Text>
                </View>
                <StatusBadge label={r.status} variant={STATUS_VARIANT[r.status] || 'neutral'} />
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {counts.all === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptyText}>
              Try a different search term or filter
            </Text>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: string; count: number; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{icon} {title}</Text>
        <Text style={styles.sectionCount}>({count})</Text>
      </View>
      <Card style={styles.sectionCard}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  clearBtn: {
    fontSize: fontSize.md,
    color: colors.textLight,
    padding: 4,
  },
  tabScroll: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
    maxHeight: 44,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 4,
    paddingVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  tabActive: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenDark,
  },
  tabLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.white },
  summaryBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultNum: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '600',
  },
  resultName: { fontSize: fontSize.md, fontWeight: '600' },
  resultSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  resultDetail: { fontSize: fontSize.xs, color: colors.textLight, marginTop: 1 },
  resultRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultAmount: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.greenDark,
  },
  emptyCard: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textLight, textAlign: 'center' },
});
