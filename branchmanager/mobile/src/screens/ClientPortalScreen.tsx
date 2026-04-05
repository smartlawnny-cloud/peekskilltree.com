import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert,
} from 'react-native';
import { colors, spacing, radius, fontSize } from '../theme';
import { Card } from '../components/Card';
import { QuoteStatusBadge } from '../components/QuoteStatusBadge';
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge';
import { LineItemRow } from '../components/LineItemRow';
import { currency } from '../utils/format';
import type { Quote, Invoice, LineItem } from '../models/types';

type Tab = 'quote' | 'invoice' | 'messages';

const DEMO_QUOTE: Quote = {
  id: 'q1', quoteNumber: 501, clientId: 'c1', clientName: 'Brian Heermance',
  property: '7 Lynwood Court, Cortlandt Manor, NY',
  lineItems: [
    { id: '1', name: 'Tree Removal', description: '2x 24" DBH oaks', quantity: 2, unitPrice: 2400, total: 4800 },
    { id: '2', name: 'Stump Grinding', description: '2 stumps', quantity: 2, unitPrice: 150, total: 300 },
    { id: '3', name: 'Haul Debris', description: 'All debris from site', quantity: 1, unitPrice: 350, total: 350 },
  ],
  total: 5450, status: 'sent', createdAt: '2026-04-01',
};

const DEMO_INVOICE: Invoice = {
  id: 'i1', invoiceNumber: 379, clientId: 'c1', clientName: 'Brian Heermance',
  subject: 'For Services Rendered',
  lineItems: [
    { id: '1', name: 'Tree Removal', description: '2x 24" DBH oaks', quantity: 2, unitPrice: 2400, total: 4800 },
  ],
  total: 4800, balance: 4800, amountPaid: 0, status: 'sent', dueDate: '2026-04-15',
};

export function ClientPortalScreen({ navigation, route }: any) {
  const [tab, setTab] = useState<Tab>('quote');
  const [message, setMessage] = useState('');
  const quote = route?.params?.quote || DEMO_QUOTE;
  const invoice = route?.params?.invoice || DEMO_INVOICE;

  const handleApproveQuote = () => {
    Alert.alert('Approve Quote', `Approve Quote #${quote.quoteNumber} for ${currency(quote.total)}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => Alert.alert('Approved', 'Quote approved! Work will be scheduled.') },
    ]);
  };

  const handleDeclineQuote = () => {
    Alert.alert('Decline Quote', 'Are you sure you want to decline this quote?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Request Changes', onPress: () => Alert.alert('Changes Requested', 'We\'ll follow up with you.') },
      { text: 'Decline', style: 'destructive', onPress: () => Alert.alert('Declined', 'Quote declined.') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Portal</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['quote', 'invoice', 'messages'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'quote' ? 'Quote' : t === 'invoice' ? 'Invoice' : 'Messages'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Quote Tab */}
        {tab === 'quote' && (
          <>
            <View style={styles.statusRow}>
              <QuoteStatusBadge status={quote.status} />
              <Text style={styles.quoteNum}>Quote #{quote.quoteNumber}</Text>
            </View>

            {quote.property && (
              <Card>
                <Text style={styles.propertyLabel}>Property</Text>
                <Text style={styles.propertyValue}>{quote.property}</Text>
              </Card>
            )}

            <Card>
              <Text style={styles.sectionTitle}>Scope of Work</Text>
              {quote.lineItems.map((item: LineItem, i: number) => (
                <LineItemRow key={item.id} item={item} index={i} />
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{currency(quote.total)}</Text>
              </View>
            </Card>

            {quote.status === 'sent' || quote.status === 'viewed' ? (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveBtn} onPress={handleApproveQuote}>
                  <Text style={styles.approveBtnText}>✓ Approve Quote</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineQuote}>
                  <Text style={styles.declineBtnText}>Decline / Request Changes</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

        {/* Invoice Tab */}
        {tab === 'invoice' && (
          <>
            <View style={styles.statusRow}>
              <InvoiceStatusBadge status={invoice.status} />
              <Text style={styles.quoteNum}>Invoice #{invoice.invoiceNumber}</Text>
            </View>

            <Card>
              <Text style={styles.sectionTitle}>{invoice.subject}</Text>
              {invoice.lineItems.map((item: LineItem, i: number) => (
                <LineItemRow key={item.id} item={item} index={i} />
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{currency(invoice.total)}</Text>
              </View>
              {invoice.balance > 0 && (
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Balance Due</Text>
                  <Text style={styles.balanceValue}>{currency(invoice.balance)}</Text>
                </View>
              )}
              {invoice.dueDate && (
                <Text style={styles.dueText}>Due: {invoice.dueDate}</Text>
              )}
            </Card>

            {invoice.balance > 0 && (
              <TouchableOpacity style={styles.payBtn}>
                <Text style={styles.payBtnText}>Pay Invoice — {currency(invoice.balance)}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Messages Tab */}
        {tab === 'messages' && (
          <>
            <Card style={styles.messageCard}>
              <Text style={styles.messageAuthor}>Second Nature Tree Service</Text>
              <Text style={styles.messageText}>Hi! Here's your quote for the two oak removals. Let us know if you have any questions.</Text>
              <Text style={styles.messageTime}>Apr 1, 10:30 AM</Text>
            </Card>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={() => { if (message.trim()) { Alert.alert('Sent', message); setMessage(''); } }}>
                <Text style={styles.sendText}>↑</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { fontSize: fontSize.md, color: colors.accent, fontWeight: '600' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800' },
  tabRow: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.greenDark },
  tabLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  tabLabelActive: { color: colors.greenDark },
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  quoteNum: { fontSize: fontSize.md, fontWeight: '700', color: colors.textSecondary },
  propertyLabel: { fontSize: fontSize.sm, color: colors.textLight, marginBottom: 4 },
  propertyValue: { fontSize: fontSize.md, fontWeight: '600' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.md },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 2, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.sm,
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '800' },
  totalValue: { fontSize: fontSize.xl, fontWeight: '800', color: colors.greenDark },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm,
  },
  balanceLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.red },
  balanceValue: { fontSize: fontSize.lg, fontWeight: '800', color: colors.red },
  dueText: { fontSize: fontSize.sm, color: colors.textLight, marginTop: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  approveBtn: { backgroundColor: colors.greenDark, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center' },
  approveBtnText: { color: colors.white, fontWeight: '800', fontSize: fontSize.lg },
  declineBtn: { paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  declineBtnText: { fontWeight: '600', color: colors.textSecondary },
  payBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.lg },
  payBtnText: { color: colors.white, fontWeight: '800', fontSize: fontSize.lg },
  messageCard: { marginBottom: spacing.md },
  messageAuthor: { fontSize: fontSize.sm, fontWeight: '700', color: colors.greenDark },
  messageText: { fontSize: fontSize.md, color: colors.text, marginTop: spacing.sm, lineHeight: 22 },
  messageTime: { fontSize: fontSize.xs, color: colors.textLight, marginTop: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  messageInput: {
    flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 15, color: colors.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.greenDark,
    alignItems: 'center', justifyContent: 'center',
  },
  sendText: { color: colors.white, fontSize: 20, fontWeight: '800' },
});
