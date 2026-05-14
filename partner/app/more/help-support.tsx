import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, FontSize, Radius } from '../../constants/theme';

export default function HelpSupportScreen() {
  const contactEmail = 'support@guidemyroute.com';
  const contactPhone = '+91 9876543210';

  const handleEmail = () => {
    Linking.openURL(`mailto:${contactEmail}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${contactPhone}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.supportCard}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Text style={styles.cardText}>
            Have questions or need assistance? Our team is here to help you.
          </Text>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Email Support</Text>
              <Text style={styles.contactValue}>{contactEmail}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.contactLabel}>Call Us</Text>
              <Text style={styles.contactValue}>{contactPhone}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <FaqItem 
            question="How do I update my profile?" 
            answer="Go to the Profile tab and tap on 'Edit Profile' to update your basic information or business details." 
          />
          <FaqItem 
            question="How do bookings work?" 
            answer="When a user books your service, you will receive a notification. You can view all requests in the Bookings tab." 
          />
          <FaqItem 
            question="When do I get paid?" 
            answer="Payments are processed after the completion of a booking. Check the Earnings section for details." 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.textMuted} />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.md,
  },
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cardText: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  faqSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  faqAnswer: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});
