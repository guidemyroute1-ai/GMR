import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BriefcaseBusiness } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Text } from './Text';

export default function Header() {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <BriefcaseBusiness size={18} color={Colors.white} />
        </View>
        <Text style={styles.title}>Partner Console</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.white },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginRight: 10,
  },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
});

