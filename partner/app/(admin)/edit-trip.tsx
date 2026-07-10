import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { CalendarPickerModal } from '../../components/CalendarPickerModal';
import * as ImagePicker from 'expo-image-picker';
import { MapPickerModal } from '../../components/MapPickerModal';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Use the regular supabase client — RLS policy allows admin-role users to insert trips

// ─── Types ─────────────────────────────────────────────────────────────────
type MeetingMode = 'text' | 'map';

interface DayPlan {
  id: string;
  day: number;
  title: string;
  activities: string;
  accommodation: string;
  meals: string;
  expanded: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function uploadTripImage(uri: string, userId: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `trips/${userId}/${Date.now()}.${ext}`;
  const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });

  const { error } = await supabase.storage
    .from('trip-images')
    .upload(fileName, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('trip-images').getPublicUrl(fileName);
  return data.publicUrl;
}

function makeDayId() {
  return `day_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function EditTripScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    price: '',
    capacity: '20',
    city: '',
    location_text: '',
    lat: null as number | null,
    lng: null as number | null,
    date: new Date(Date.now() + 864e5 * 3),
    end_date: new Date(Date.now() + 864e5 * 4),
    difficulty: 'Easy' as 'Easy' | 'Moderate' | 'Hard',
    what_to_bring: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('text');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // ─── Day Plans ────────────────────────────────────────────────────
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);

  // ─── Fetch Existing Trip ──────────────────────────────────────────
  useEffect(() => {
    async function fetchTrip() {
      if (!id) {
        Alert.alert('Error', 'No trip ID provided');
        router.back();
        return;
      }

      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setForm({
            title: data.title || '',
            subtitle: data.subtitle || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            capacity: data.capacity?.toString() || '',
            city: data.city || '',
            location_text: data.location_text || '',
            lat: data.meeting_lat || null,
            lng: data.meeting_lng || null,
            date: data.trip_date ? new Date(data.trip_date) : new Date(Date.now() + 864e5 * 3),
            end_date: data.end_date ? new Date(data.end_date) : new Date(Date.now() + 864e5 * 4),
            difficulty: data.difficulty || 'Easy',
            what_to_bring: data.what_to_bring || '',
          });

          if (data.images && data.images.length > 0) {
            setImages(data.images);
          }

          if (data.day_plans && data.day_plans.length > 0) {
            setDayPlans(
              data.day_plans.map((dp: any) => ({
                id: dp.id || makeDayId(),
                day: dp.day,
                title: dp.title || '',
                activities: dp.activities || '',
                accommodation: dp.accommodation || '',
                meals: dp.meals || '',
                expanded: false, // Start collapsed for editing
              }))
            );
          }
          
          if (data.meeting_lat && data.meeting_lng) {
            setMeetingMode('map');
          }
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not fetch trip details');
        router.back();
      } finally {
        setIsFetching(false);
      }
    }

    fetchTrip();
  }, [id]);

  const addDay = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextDay = dayPlans.length + 1;
    setDayPlans((prev) => [
      ...prev,
      {
        id: makeDayId(),
        day: nextDay,
        title: '',
        activities: '',
        accommodation: '',
        meals: '',
        expanded: true,
      },
    ]);
  };

  const removeDay = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDayPlans((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      // Re-number days after removal
      return filtered.map((d, i) => ({ ...d, day: i + 1 }));
    });
  };

  const updateDay = (id: string, field: keyof DayPlan, value: string | boolean) => {
    setDayPlans((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const toggleDayExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDayPlans((prev) =>
      prev.map((d) => (d.id === id ? { ...d, expanded: !d.expanded } : d))
    );
  };

  // ─── Image Picker ─────────────────────────────────────────────────
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to add trip photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (uri: string) =>
    setImages((prev) => prev.filter((i) => i !== uri));

  // ─── Map Picker ───────────────────────────────────────────────────
  const handleMapConfirm = (locationText: string, lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, location_text: locationText, lat, lng }));
    setShowMapPicker(false);
  };

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    if (
      !form.title.trim() ||
      !form.subtitle.trim() ||
      !form.description.trim() ||
      !form.price ||
      !form.capacity ||
      !form.city.trim() ||
      !form.location_text.trim() ||
      images.length === 0
    ) {
      Alert.alert('Missing Fields', 'Please fill all required fields and add at least one image.');
      return;
    }

    if (meetingMode === 'map' && (form.lat === null || form.lng === null)) {
      Alert.alert('Missing Location', 'Please select a meeting point on the map.');
      return;
    }

    if (form.end_date < form.date) {
      Alert.alert('Invalid Dates', 'End date must be on or after the start date.');
      return;
    }

    // Validate day plans have at least a title if added
    const invalidDay = dayPlans.find((d) => !d.title.trim() || !d.activities.trim());
    if (invalidDay) {
      Alert.alert(
        'Incomplete Day Plan',
        `Day ${invalidDay.day} is missing a title or activities. Please fill it in or remove it.`
      );
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploadingImages(true);
        imageUrls = await Promise.all(images.map((uri) => uploadTripImage(uri, user.uid)));
        setUploadingImages(false);
      }

      const cleanDayPlans = dayPlans.map(({ id, expanded, ...rest }) => rest);

      const { error } = await supabase.from('trips').update({
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        trip_date: form.date.toISOString(),
        end_date: form.end_date.toISOString(),
        price: parseFloat(form.price),
        capacity: parseInt(form.capacity, 10),
        city: form.city,
        location_text: form.location_text,
        difficulty: form.difficulty,
        what_to_bring: form.what_to_bring.trim() || null,
        day_plans: cleanDayPlans.length > 0 ? cleanDayPlans : null,
        ...(form.lat != null && form.lng != null
          ? { meeting_lat: form.lat, meeting_lng: form.lng }
          : {}),
        images: imageUrls,
      }).eq('id', id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Trip Updated! 🎉',
        'Your official trip has been successfully updated.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      console.error('Trip update error:', JSON.stringify(err, null, 2));
      Alert.alert('Error', err.message || 'Could not update trip.');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const DIFFICULTY_OPTIONS: Array<'Easy' | 'Moderate' | 'Hard'> = ['Easy', 'Moderate', 'Hard'];
  const difficultyColor = { Easy: '#16a34a', Moderate: '#f59e0b', Hard: '#ef4444' };

  if (isFetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Trip Images ─────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Trip Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.imageRow}>
              {images.map((uri) => (
                <View key={uri} style={styles.imageThumbWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(uri)}>
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                  <Ionicons name="camera-outline" size={26} color="#16a34a" />
                  <Text style={styles.addImageText}>
                    {images.length === 0 ? 'Add Photos' : 'Add More'}
                  </Text>
                  <Text style={styles.addImageHint}>{images.length}/5</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ── Trip Title ──────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Trip Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sunday Morning Hike"
            placeholderTextColor="#9ca3af"
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
          />
        </View>

        {/* ── Subtitle ────────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subtitle</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Explore nature trails"
            placeholderTextColor="#9ca3af"
            value={form.subtitle}
            onChangeText={(t) => setForm({ ...form, subtitle: t })}
          />
        </View>

        {/* ── Price + Capacity ─────────────────────────────────────── */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 499"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(t) => setForm({ ...form, price: t })}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Capacity *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 20"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={form.capacity}
              onChangeText={(t) => setForm({ ...form, capacity: t })}
            />
          </View>
        </View>

        {/* ── Start Date + End Date ────────────────────────────────── */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker('start')}
            >
              <Text style={{ color: '#111827' }}>{form.date.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() => setShowDatePicker('end')}
            >
              <Text style={{ color: '#111827' }}>{form.end_date.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CalendarPickerModal
          visible={!!showDatePicker}
          onClose={() => setShowDatePicker(null)}
          date={showDatePicker === 'start' ? form.date : form.end_date}
          minDate={showDatePicker === 'end' ? form.date : new Date()}
          title={showDatePicker === 'start' ? 'Select Start Date' : 'Select End Date'}
          onSelectDate={(selectedDate) => {
            if (showDatePicker === 'start') {
              setForm({ ...form, date: selectedDate });
            } else if (showDatePicker === 'end') {
              setForm({ ...form, end_date: selectedDate });
            }
          }}
        />

        {/* ── Difficulty ───────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Difficulty Level</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.difficultyChip,
                  form.difficulty === opt && {
                    backgroundColor: difficultyColor[opt],
                    borderColor: difficultyColor[opt],
                  },
                ]}
                onPress={() => setForm({ ...form, difficulty: opt })}
              >
                <Text
                  style={[
                    styles.difficultyChipText,
                    form.difficulty === opt && { color: '#fff' },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── City ────────────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Delhi"
            placeholderTextColor="#9ca3af"
            value={form.city}
            onChangeText={(t) => setForm({ ...form, city: t })}
          />
        </View>

        {/* ── Meeting Point ────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meeting Point</Text>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, meetingMode === 'text' && styles.modeBtnActive]}
              onPress={() => setMeetingMode('text')}
            >
              <Ionicons
                name="text-outline"
                size={15}
                color={meetingMode === 'text' ? '#fff' : '#6b7280'}
              />
              <Text style={[styles.modeBtnLabel, meetingMode === 'text' && styles.modeBtnLabelActive]}>
                Type Manually
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, meetingMode === 'map' && styles.modeBtnActive]}
              onPress={() => setMeetingMode('map')}
            >
              <Ionicons
                name="map-outline"
                size={15}
                color={meetingMode === 'map' ? '#fff' : '#6b7280'}
              />
              <Text style={[styles.modeBtnLabel, meetingMode === 'map' && styles.modeBtnLabelActive]}>
                Select on Map
              </Text>
            </TouchableOpacity>
          </View>

          {meetingMode === 'text' ? (
            <TextInput
              style={styles.input}
              placeholder="e.g. Hauz Khas Metro Station"
              placeholderTextColor="#9ca3af"
              value={form.location_text}
              onChangeText={(t) => setForm({ ...form, location_text: t, lat: null, lng: null })}
            />
          ) : (
            <TouchableOpacity
              style={[styles.input, styles.mapPreviewBtn]}
              onPress={() => setShowMapPicker(true)}
            >
              <Ionicons name="location-sharp" size={18} color={form.location_text ? '#16a34a' : '#9ca3af'} />
              <Text
                style={[styles.mapPreviewText, form.location_text && styles.mapPreviewTextSet]}
                numberOfLines={2}
              >
                {form.location_text || 'Tap to open map & pin location'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Description ──────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about the trip..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
          />
        </View>

        {/* ── What to Bring ─────────────────────────────────────────── */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>What to Bring</Text>
          <TextInput
            style={[styles.input, styles.textArea, { height: 90 }]}
            placeholder="e.g. Comfortable shoes, water bottle, sunscreen..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            value={form.what_to_bring}
            onChangeText={(t) => setForm({ ...form, what_to_bring: t })}
          />
        </View>

        {/* ── Day-wise Itinerary ────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color="#16a34a" />
            <Text style={styles.sectionTitle}>Day-wise Itinerary</Text>
          </View>
          <TouchableOpacity style={styles.addDayBtn} onPress={addDay}>
            <Ionicons name="add" size={16} color="#16a34a" />
            <Text style={styles.addDayBtnText}>Add Day</Text>
          </TouchableOpacity>
        </View>

        {dayPlans.length === 0 && (
          <TouchableOpacity style={styles.emptyDayCard} onPress={addDay}>
            <Ionicons name="sunny-outline" size={28} color="#16a34a" />
            <Text style={styles.emptyDayText}>Tap to add your first day plan</Text>
            <Text style={styles.emptyDayHint}>e.g. Day 1 — Arrival & City Tour</Text>
          </TouchableOpacity>
        )}

        {dayPlans.map((day) => (
          <View key={day.id} style={styles.dayCard}>
            {/* Day Card Header */}
            <TouchableOpacity
              style={styles.dayCardHeader}
              onPress={() => toggleDayExpand(day.id)}
              activeOpacity={0.7}
            >
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Day {day.day}</Text>
              </View>
              <Text
                style={styles.dayCardTitle}
                numberOfLines={1}
              >
                {day.title.trim() || `Untitled Day ${day.day}`}
              </Text>
              <View style={styles.dayCardActions}>
                <TouchableOpacity
                  onPress={() => removeDay(day.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
                <Ionicons
                  name={day.expanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#9ca3af"
                  style={{ marginLeft: 12 }}
                />
              </View>
            </TouchableOpacity>

            {day.expanded && (
              <View style={styles.dayCardBody}>
                {/* Day Title */}
                <View style={styles.dayField}>
                  <Text style={styles.dayFieldLabel}>Day Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`e.g. Arrival & City Tour`}
                    placeholderTextColor="#9ca3af"
                    value={day.title}
                    onChangeText={(t) => updateDay(day.id, 'title', t)}
                  />
                </View>

                {/* Activities */}
                <View style={styles.dayField}>
                  <Text style={styles.dayFieldLabel}>Activities / Plan *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe activities, places to visit, timings..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    value={day.activities}
                    onChangeText={(t) => updateDay(day.id, 'activities', t)}
                  />
                </View>

                {/* Accommodation + Meals side by side */}
                <View style={styles.row}>
                  <View style={[styles.dayField, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.dayFieldLabel}>
                      <Ionicons name="bed-outline" size={12} color="#6b7280" /> Accommodation
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Hotel / Camping"
                      placeholderTextColor="#9ca3af"
                      value={day.accommodation}
                      onChangeText={(t) => updateDay(day.id, 'accommodation', t)}
                    />
                  </View>
                  <View style={[styles.dayField, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.dayFieldLabel}>
                      <Ionicons name="restaurant-outline" size={12} color="#6b7280" /> Meals
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Breakfast included"
                      placeholderTextColor="#9ca3af"
                      value={day.meals}
                      onChangeText={(t) => updateDay(day.id, 'meals', t)}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}

        {dayPlans.length > 0 && (
          <TouchableOpacity style={styles.addAnotherDayBtn} onPress={addDay}>
            <Ionicons name="add-circle-outline" size={18} color="#16a34a" />
            <Text style={styles.addAnotherDayText}>Add Day {dayPlans.length + 1}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.submitButtonText}>
                {uploadingImages ? 'Uploading photos…' : 'Submitting…'}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Text style={styles.submitButtonText}>Update Trip</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onConfirm={handleMapConfirm}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 32 },
  inputGroup: { marginBottom: 14 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 45,
    fontSize: 16,
    color: '#0f172a',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },

  // ── Difficulty ─────────────────────────────────────────────────────
  difficultyRow: { flexDirection: 'row', gap: 10 },
  difficultyChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  difficultyChipText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },

  // ── Image picker ───────────────────────────────────────────────────
  imageRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  imageThumbWrap: { position: 'relative' },
  imageThumb: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  removeImg: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    padding: 0,
  },
  addImageBtn: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  addImageHint: { fontSize: 10, color: '#9ca3af' },

  // ── Meeting mode toggle ────────────────────────────────────────────
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  modeBtnActive: { backgroundColor: '#16a34a' },
  modeBtnLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  modeBtnLabelActive: { color: '#fff' },

  // ── Map preview button ─────────────────────────────────────────────
  mapPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 'auto' as any,
    minHeight: 54,
    paddingVertical: 14,
  },
  mapPreviewText: { flex: 1, fontSize: 15, color: '#9ca3af', lineHeight: 20 },
  mapPreviewTextSet: { color: '#0f172a' },

  // ── Day-wise Itinerary ─────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  addDayBtnText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },

  emptyDayCard: {
    borderWidth: 1.5,
    borderColor: '#d1fae5',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    marginBottom: 16,
  },
  emptyDayText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  emptyDayHint: { fontSize: 12, color: '#6b7280' },

  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  dayBadge: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayCardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },
  dayCardActions: { flexDirection: 'row', alignItems: 'center' },
  dayCardBody: { padding: 14, gap: 12 },
  dayField: { marginBottom: 0 },
  dayFieldLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 6 },

  addAnotherDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
    backgroundColor: '#f0fdf4',
    marginBottom: 8,
  },
  addAnotherDayText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },

  // ── Footer ─────────────────────────────────────────────────────────
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' },
  submitButton: {
    backgroundColor: '#16a34a',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
