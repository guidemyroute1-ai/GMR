import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';

interface TripsFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export function TripsFilterModal({ visible, onClose, onApply }: TripsFilterModalProps) {
  const [selectedSort, setSelectedSort] = useState('Recommended');
  const [selectedVibe, setSelectedVibe] = useState('All');

  const SORT_OPTIONS = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Date: Earliest'];
  const VIBE_OPTIONS = ['All', 'Adventure', 'Relaxing', 'Party', 'Nature', 'Culture'];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#1f2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.optionsGrid}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, selectedSort === opt && styles.optionChipActive]}
                  onPress={() => setSelectedSort(opt)}
                >
                  <Text style={[styles.optionText, selectedSort === opt && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vibe */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Trip Vibe</Text>
            <View style={styles.optionsGrid}>
              {VIBE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, selectedVibe === opt && styles.optionChipActive]}
                  onPress={() => setSelectedVibe(opt)}
                >
                  <Text style={[styles.optionText, selectedVibe === opt && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetBtn} onPress={() => { setSelectedSort('Recommended'); setSelectedVibe('All'); }}>
              <Text style={styles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={() => { onApply({ sort: selectedSort, vibe: selectedVibe }); onClose(); }}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  optionChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  optionText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
