import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Radius, Spacing } from '../constants/theme';
import { Text } from './Text';

type FocusProps = {
  focused?: string | null;
  name?: string;
  setFocused?: (name: string | null) => void;
};

export function TextField({
  label,
  focused,
  name,
  setFocused,
  style,
  ...props
}: TextInputProps & FocusProps & { label: string }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && styles.multiline, focused === name && styles.focused, style]}
        placeholderTextColor={Colors.textLight}
        onFocus={(event) => {
          setFocused?.(name ?? null);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused?.(null);
          props.onBlur?.(event);
        }}
      />
    </View>
  );
}

export function SingleSelectDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
}: FocusProps & {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || placeholder}</Text>
      </TouchableOpacity>
      <OptionsModal visible={open} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <TouchableOpacity key={option} style={styles.option} onPress={() => { onChange(option); setOpen(false); }}>
            <Text style={styles.optionText}>{option}</Text>
            {value === option && <Check size={18} color={Colors.primary} />}
          </TouchableOpacity>
        ))}
      </OptionsModal>
    </View>
  );
}

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: FocusProps & {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const value = selected.length ? selected.join(', ') : '';

  const toggle = (option: string) => {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.placeholder]} numberOfLines={2}>{value || placeholder}</Text>
      </TouchableOpacity>
      <OptionsModal visible={open} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <TouchableOpacity key={option} style={styles.option} onPress={() => toggle(option)}>
            <Text style={styles.optionText}>{option}</Text>
            {selected.includes(option) && <Check size={18} color={Colors.primary} />}
          </TouchableOpacity>
        ))}
      </OptionsModal>
    </View>
  );
}

function OptionsModal({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {children}
          <TouchableOpacity style={styles.done} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  input: {
    minHeight: 50,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.text,
  },
  focused: { borderColor: Colors.primary, backgroundColor: Colors.white },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  selectText: { color: Colors.text, fontSize: 16 },
  placeholder: { color: Colors.textLight },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, maxHeight: '72%' },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  optionText: { fontSize: 16, color: Colors.text },
  done: { marginTop: 14, backgroundColor: Colors.primary, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: 14 },
  doneText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});

