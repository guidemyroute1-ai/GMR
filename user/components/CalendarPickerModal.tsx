import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date;
  onSelectDate: (date: Date) => void;
  title?: string;
  minDate?: Date;
}

export function CalendarPickerModal({
  visible,
  onClose,
  date,
  onSelectDate,
  title = 'Select Date',
  minDate,
}: CalendarPickerModalProps) {
  // Format Date to YYYY-MM-DD for react-native-calendars
  const formatDateToYMD = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Calendar
            current={formatDateToYMD(date)}
            minDate={minDate ? formatDateToYMD(minDate) : undefined}
            onDayPress={(day: any) => {
              // day.timestamp is in UTC. Create a local date taking timezone into account.
              const selectedDate = new Date(day.timestamp);
              // adjust for local timezone offset so it doesn't shift the day
              const offset = selectedDate.getTimezoneOffset() * 60000;
              const localDate = new Date(selectedDate.getTime() + offset);

              onSelectDate(localDate);
              onClose();
            }}
            markedDates={{
              [formatDateToYMD(date)]: { selected: true, selectedColor: '#16a34a' },
            }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6b7280',
              selectedDayBackgroundColor: '#16a34a',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#16a34a',
              dayTextColor: '#111827',
              textDisabledColor: '#d1d5db',
              arrowColor: '#16a34a',
              monthTextColor: '#111827',
              textMonthFontWeight: 'bold',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
});
