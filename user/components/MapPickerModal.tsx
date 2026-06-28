import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (locationText: string, lat: number, lng: number) => void;
}

/** Reverse-geocode via OpenStreetMap Nominatim (free, no API key) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'GMR-App/1.0' } }
    );
    const json = await res.json();
    return (
      json?.display_name?.split(',').slice(0, 3).join(', ') ??
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    );
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; }
        /* Prevent text selection */
        * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([28.6139, 77.2090], 12); // Default to New Delhi
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        var currentMarker = null;

        function setMarker(lat, lng) {
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat, lng]).addTo(map);
        }

        function setView(lat, lng, zoom) {
            map.setView([lat, lng], zoom);
            setMarker(lat, lng);
        }

        map.on('click', function(e) {
            setMarker(e.latlng.lat, e.latlng.lng);
            // Send coordinates back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                lat: e.latlng.lat,
                lng: e.latlng.lng
            }));
        });

        // Listen for messages from React Native
        document.addEventListener('message', function(event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === 'setLocation') {
                    setView(data.lat, data.lng, 15);
                }
            } catch (err) {}
        });
        
        window.addEventListener('message', function(event) {
            try {
                var data = JSON.parse(event.data);
                if (data.type === 'setLocation') {
                    setView(data.lat, data.lng, 15);
                }
            } catch (err) {}
        });
    </script>
</body>
</html>
`;

export function MapPickerModal({ visible, onClose, onConfirm }: MapPickerModalProps) {
  const webViewRef = useRef<WebView>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleWebViewMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        setMarker({ lat: data.lat, lng: data.lng });
        setGeocoding(true);
        const addr = await reverseGeocode(data.lat, data.lng);
        setAddress(addr);
        setGeocoding(false);
      }
    } catch (err) {
      console.warn('Failed to parse WebView message', err);
    }
  }, []);

  const handleUseMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow location access to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setMarker({ lat: latitude, lng: longitude });
      
      // Tell WebView to update its view
      webViewRef.current?.injectJavaScript(`
        if (typeof setView === 'function') {
          setView(${latitude}, ${longitude}, 15);
        }
        true;
      `);

      setGeocoding(true);
      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
      setGeocoding(false);
    } catch {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!marker) {
      Alert.alert('Select a location', 'Tap anywhere on the map to pin your meeting point.');
      return;
    }
    onConfirm(address, marker.lat, marker.lng);
  }, [marker, address, onConfirm]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.wrapper}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Select Location</Text>
          <View style={s.headerRight} />
        </View>

        {/* Map via WebView */}
        <View style={s.mapContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: leafletHTML }}
            style={s.webview}
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
            bounces={false}
          />

          {/* Floating Action Buttons */}
          <View style={s.fabContainer}>
            <TouchableOpacity 
              style={s.fabBtn} 
              onPress={handleUseMyLocation}
              activeOpacity={0.8}
            >
              {locating ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <Ionicons name="locate" size={22} color="#16A34A" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Panel */}
        <View style={s.bottomPanel}>
          <View style={s.addressCard}>
            <Ionicons name="location" size={24} color="#16A34A" style={s.addressIcon} />
            <View style={s.addressTextCol}>
              <Text style={s.addressLabel}>Selected Meeting Point</Text>
              {geocoding ? (
                <View style={s.loadingRow}>
                  <ActivityIndicator size="small" color="#6B7280" />
                  <Text style={s.loadingText}>Fetching address...</Text>
                </View>
              ) : (
                <Text style={s.addressValue} numberOfLines={2}>
                  {address || 'Tap on the map to drop a pin'}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, !marker && s.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!marker || geocoding}
            activeOpacity={0.85}
          >
            <Text style={s.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerRight: { width: 40 },
  mapContainer: { flex: 1, backgroundColor: '#E5E7EB', position: 'relative' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 20,
  },
  fabBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomPanel: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 40,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  addressIcon: { marginRight: 16 },
  addressTextCol: { flex: 1 },
  addressLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  addressValue: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 22 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  loadingText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  confirmBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { backgroundColor: '#9CA3AF' },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
