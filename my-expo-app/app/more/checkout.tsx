import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { Text } from '../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#16A34A', white: '#FFFFFF', bg: '#F8FAFC',
  dark: '#111827', gray: '#6B7280', lightGray: '#F1F5F9',
  border: '#E2E8F0', teal: '#14B8A6', blue: '#3B82F6',
  amber: '#F59E0B', danger: '#EF4444',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const diffDays = (a: Date, b: Date) => Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 864e5));

type PickerState = { visible: boolean; mode: 'date' | 'time'; target: 'start' | 'end' };

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    bookingType: string; itemId: string; itemName: string;
    pricePerUnit: string; partnerId: string; unitLabel: string;
  }>();

  const unitPrice = parseFloat(params.pricePerUnit || '0');
  const unitLabel = params.unitLabel || 'day';
  const isHourly = unitLabel === 'hour';

  // ── Date / Time state ────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0);
    d.setDate(d.getDate() + 1); d.setHours(10); return d;
  });
  const [picker, setPicker] = useState<PickerState>({ visible: false, mode: 'date', target: 'start' });

  // ── Pricing ──────────────────────────────────────────────────────────────────
  const quantity = useMemo(() => {
    if (isHourly) {
      const hrs = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 36e5));
      return hrs;
    }
    return diffDays(startDate, endDate);
  }, [startDate, endDate, isHourly]);

  const subtotal = unitPrice * quantity;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  // ── Picker handler ───────────────────────────────────────────────────────────
  const onPickerChange = (_: any, selected?: Date) => {
    setPicker(p => ({ ...p, visible: false }));
    if (!selected) return;
    const update = (prev: Date) => {
      const d = new Date(prev);
      if (picker.mode === 'date') { d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate()); }
      else { d.setHours(selected.getHours(), selected.getMinutes()); }
      return d;
    };
    if (picker.target === 'start') {
      const ns = update(startDate);
      setStartDate(ns);
      if (ns >= endDate) { const ne = new Date(ns); ne.setDate(ne.getDate() + 1); setEndDate(ne); }
    } else {
      const ne = update(endDate);
      if (ne > startDate) setEndDate(ne);
    }
  };

  const openPicker = (target: 'start' | 'end', mode: 'date' | 'time') =>
    setPicker({ visible: true, mode, target });

  // ── Navigate to payment ──────────────────────────────────────────────────────
  const handleProceed = () => {
    router.push({
      pathname: '/more/payment',
      params: {
        amount: String(total),
        description: `${params.itemName} – ${quantity} ${unitLabel}${quantity > 1 ? 's' : ''}`,
        bookingType: params.bookingType || 'unknown',
        itemId: params.itemId || '',
        itemName: params.itemName || '',
        days: String(quantity),
        partnerId: params.partnerId || params.itemId || '',
      },
    });
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={C.dark} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Item summary */}
        <View style={s.card}>
          <View style={s.itemRow}>
            <View style={s.itemIconBox}>
              <Ionicons
                name={params.bookingType === 'vehicle' ? 'car-sport' : params.bookingType === 'hotel' ? 'bed' : 'person'}
                size={24} color={C.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{params.itemName || 'Booking'}</Text>
              <Text style={s.itemType}>{(params.bookingType || '').charAt(0).toUpperCase() + (params.bookingType || '').slice(1)} Booking</Text>
            </View>
          </View>
        </View>

        {/* Date selection */}
        <Text style={s.sectionLabel}>Select Date & Time</Text>
        <View style={s.card}>
          {/* Start */}
          <Text style={s.dateLabel}>Start</Text>
          <View style={s.dateRow}>
            <TouchableOpacity style={s.dateChip} onPress={() => openPicker('start', 'date')} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={16} color={C.primary} />
              <Text style={s.dateChipText}>{fmt(startDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dateChip} onPress={() => openPicker('start', 'time')} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={16} color={C.blue} />
              <Text style={s.dateChipText}>{fmtTime(startDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.separator} />

          {/* End */}
          <Text style={s.dateLabel}>End</Text>
          <View style={s.dateRow}>
            <TouchableOpacity style={s.dateChip} onPress={() => openPicker('end', 'date')} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={16} color={C.primary} />
              <Text style={s.dateChipText}>{fmt(endDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dateChip} onPress={() => openPicker('end', 'time')} activeOpacity={0.7}>
              <Ionicons name="time-outline" size={16} color={C.blue} />
              <Text style={s.dateChipText}>{fmtTime(endDate)}</Text>
            </TouchableOpacity>
          </View>

          {/* Duration badge */}
          <View style={s.durationBadge}>
            <Ionicons name="timer-outline" size={16} color={C.teal} />
            <Text style={s.durationText}>
              Duration: <Text style={{ fontWeight: '700', color: C.teal }}>{quantity} {unitLabel}{quantity > 1 ? 's' : ''}</Text>
            </Text>
          </View>
        </View>

        {/* Price breakdown */}
        <Text style={s.sectionLabel}>Price Details</Text>
        <View style={s.card}>
          <Row label={`₹${unitPrice.toLocaleString('en-IN')} × ${quantity} ${unitLabel}${quantity > 1 ? 's' : ''}`} value={`₹${subtotal.toLocaleString('en-IN')}`} />
          <Row label="Service fee (5%)" value={`₹${serviceFee.toLocaleString('en-IN')}`} />
          <View style={s.priceDivider} />
          <Row label="Total" value={`₹${total.toLocaleString('en-IN')}`} bold />
        </View>

        {/* Trust badges */}
        <View style={s.trustRow}>
          <TrustBadge icon="shield-checkmark" text="Secure Payment" />
          <TrustBadge icon="refresh-circle" text="Free Cancel 24h" />
          <TrustBadge icon="call" text="24/7 Support" />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Picker */}
      {picker.visible && (
        <DateTimePicker
          value={picker.target === 'start' ? startDate : endDate}
          mode={picker.mode}
          display="default"
          onChange={onPickerChange}
          minimumDate={picker.target === 'end' ? startDate : new Date()}
        />
      )}

      {/* Bottom CTA */}
      <View style={[s.bottomCTA, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={s.ctaPrice}>₹{total.toLocaleString('en-IN')}</Text>
          <Text style={s.ctaSub}>{quantity} {unitLabel}{quantity > 1 ? 's' : ''} · incl. fees</Text>
        </View>
        <TouchableOpacity style={s.ctaBtn} activeOpacity={0.85} onPress={handleProceed}>
          <Ionicons name="lock-closed" size={16} color={C.white} />
          <Text style={s.ctaBtnText}>Proceed to Pay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Tiny components ────────────────────────────────────────────────────────────
const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={s.priceRow}>
    <Text style={[s.priceLabel, bold && s.priceBold]}>{label}</Text>
    <Text style={[s.priceValue, bold && s.priceBold]}>{value}</Text>
  </View>
);

const TrustBadge = ({ icon, text }: { icon: string; text: string }) => (
  <View style={s.trustBadge}>
    <Ionicons name={icon as any} size={18} color={C.primary} />
    <Text style={s.trustText}>{text}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.lightGray, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.dark },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: C.dark, marginBottom: 10, marginTop: 4, marginLeft: 4 },

  // Item
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemIconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#ECFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 17, fontWeight: '700', color: C.dark },
  itemType: { fontSize: 13, color: C.gray, fontWeight: '500', marginTop: 2 },

  // Dates
  dateLabel: { fontSize: 13, fontWeight: '600', color: C.gray, marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dateChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.lightGray, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
  },
  dateChipText: { fontSize: 14, fontWeight: '600', color: C.dark },
  separator: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  durationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: '#F0FDFA', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 8,
  },
  durationText: { fontSize: 13, color: C.gray, fontWeight: '500' },

  // Price
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  priceLabel: { fontSize: 14, color: C.gray, fontWeight: '500' },
  priceValue: { fontSize: 14, color: C.dark, fontWeight: '600' },
  priceBold: { fontWeight: '800', fontSize: 16, color: C.dark },
  priceDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

  // Trust
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 },
  trustBadge: { alignItems: 'center', gap: 6, flex: 1 },
  trustText: { fontSize: 11, color: C.gray, fontWeight: '600', textAlign: 'center' },

  // Bottom CTA
  bottomCTA: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 10,
  },
  ctaPrice: { fontSize: 22, fontWeight: '800', color: C.dark },
  ctaSub: { fontSize: 12, color: C.gray, fontWeight: '500', marginTop: 2 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 14,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { color: C.white, fontSize: 15, fontWeight: '800' },
});
