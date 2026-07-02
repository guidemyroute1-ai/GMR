import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, FontSize } from '../../constants/theme';
import {
  ArrowLeft,
  ArrowRight,
  Navigation,
  MapPin,
} from 'lucide-react-native';
import { useOnboardingStore } from '../../store/useOnboardingStore';

interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// ─── Leaflet HTML (OpenStreetMap, zero API key) ─────────────────────────────
const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    crossorigin=""
  />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .pin-hint {
      position: absolute;
      top: 12px; left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      padding: 8px 16px;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #1F2937;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      pointer-events: none;
      white-space: nowrap;
    }
    .pin-hint.hidden { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pin-hint" id="hint">Tap anywhere to pin your location</div>

  <script>
    var map = L.map('map', { zoomControl: true }).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    var marker = null;
    var hint = document.getElementById('hint');

    // Custom green pin icon
    var greenIcon = L.divIcon({
      className: '',
      html: '<div style="width:28px;height:28px;background:#16A34A;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    });

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;

      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng, { icon: greenIcon, draggable: true }).addTo(map);
        marker.on('dragend', function(ev) {
          var pos = ev.target.getLatLng();
          sendCoords(pos.lat, pos.lng);
        });
      }

      hint.classList.add('hidden');
      sendCoords(lat, lng);
    });

    function sendCoords(lat, lng) {
      var msg = JSON.stringify({ type: 'coords', lat: lat, lng: lng });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
    }

    // Receive messages from React Native (e.g., jump to GPS location)
    function handleRNMessage(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'setLocation') {
          var latlng = [data.lat, data.lng];
          map.setView(latlng, 16, { animate: true });
          if (marker) {
            marker.setLatLng(latlng);
          } else {
            marker = L.marker(latlng, { icon: greenIcon, draggable: true }).addTo(map);
            marker.on('dragend', function(ev) {
              var pos = ev.target.getLatLng();
              sendCoords(pos.lat, pos.lng);
            });
          }
          hint.classList.add('hidden');
          sendCoords(data.lat, data.lng);
        }
      } catch(err) {}
    }

    // Both Android and iOS
    document.addEventListener('message', handleRNMessage);
    window.addEventListener('message', handleRNMessage);
  </script>
</body>
</html>
`;

export default function LocationPickerScreen() {
  const { data: formData, updateData } = useOnboardingStore();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Reverse geocode using expo-location (free, no API key)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.name, r.street, r.district, r.city, r.region, r.country]
          .filter(Boolean)
          .join(', ');
        return parts || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } catch { /* silent */ }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Message from WebView → coordinate tapped
  const handleWebViewMessage = useCallback(
    async (event: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'coords') {
          const { lat, lng } = data;
          setReverseLoading(true);
          const address = await reverseGeocode(lat, lng);
          setReverseLoading(false);
          setPicked({ latitude: lat, longitude: lng, address });
        }
      } catch { /* ignore parse errors */ }
    },
    []
  );

  // GPS → send coords to WebView so it moves the map + pin
  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Allow location access to use this feature.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = loc.coords;

      // Move the Leaflet map to current location
      const msg = JSON.stringify({ type: 'setLocation', lat: latitude, lng: longitude });
      webViewRef.current?.injectJavaScript(
        `(function(){
          var e = new MessageEvent('message', { data: '${msg.replace(/'/g, "\\'")}' });
          window.dispatchEvent(e);
        })(); true;`
      );
    } catch {
      Alert.alert('Error', 'Could not fetch your location. Please try again.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!picked) return;
    updateData({
      latitude: picked.latitude,
      longitude: picked.longitude,
      businessAddress: picked.address,
    });
    router.push('/onboarding/profile-setup-2');
  };

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.primary} size={20} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 3 of 6</Text>
        </View>
      </View>

      {/* ── Title ── */}
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.titleBox}>
        <Text style={styles.heading}>Your Business Location</Text>
        <Text style={styles.subheading}>
          Tap on the map to pin your exact location. Users will be directed here after booking.
        </Text>
      </Animated.View>

      {/* ── GPS Button ── */}
      <Animated.View entering={FadeInUp.duration(500).springify().delay(100)}>
      <TouchableOpacity
        style={[styles.gpsBtn, gpsLoading && styles.btnDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={gpsLoading || !mapReady}
        activeOpacity={0.8}
      >
        {gpsLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Navigation color={Colors.white} size={18} />
        )}
        <Text style={styles.gpsBtnText}>
          {gpsLoading ? 'Getting GPS…' : 'Use Current Location'}
        </Text>
      </TouchableOpacity>
      </Animated.View>

      {/* ── OpenStreetMap via Leaflet WebView ── */}
      <Animated.View entering={FadeInUp.duration(500).springify().delay(200)} style={styles.mapWrapper}>
        {!mapReady && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.mapLoadingText}>Loading map…</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: LEAFLET_HTML }}
          style={[styles.webView, !mapReady && { opacity: 0 }]}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          onLoad={() => setMapReady(true)}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          bounces={false}
        />
      </Animated.View>

      {/* ── Address Preview ── */}
      <Animated.View entering={FadeInUp.duration(500).springify().delay(300)} style={styles.addressBox}>
        {reverseLoading ? (
          <View style={styles.addressLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.addressLoadingText}>Resolving address…</Text>
          </View>
        ) : picked ? (
          <View style={styles.addressRow}>
            <View style={styles.addressIconBox}>
              <MapPin size={18} color={Colors.primary} />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {picked.address}
            </Text>
            <TouchableOpacity onPress={() => setPicked(null)}>
              <Text style={styles.clearText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.addressPlaceholder}>
            Tap the map or use GPS to select your location
          </Text>
        )}
      </Animated.View>

      {/* ── Confirm Button ── */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !picked && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!picked}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
          <ArrowRight color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  stepBadge: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  titleBox: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.65 },
  gpsBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: '#E5E3DF',
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E5E3DF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  mapLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  addressBox: {
    margin: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  addressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 19,
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  addressPlaceholder: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
