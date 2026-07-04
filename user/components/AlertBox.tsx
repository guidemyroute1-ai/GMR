import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Animated, Alert, AlertButton, AlertOptions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Text } from './Text';

type AlertState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
};

let globalShowAlert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => void;

// Override React Native's Alert.alert to use our custom UI
const originalAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) => {
  if (globalShowAlert) {
    globalShowAlert(title, message, buttons, options);
  } else {
    originalAlert(title, message, buttons, options);
  }
};

export function AlertBoxProvider() {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: '',
  });

  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  useEffect(() => {
    globalShowAlert = (title, message, buttons, options) => {
      setState({
        visible: true,
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
        options,
      });
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        })
      ]).start();
    };
  }, [fadeAnim, scaleAnim]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setState(prev => ({ ...prev, visible: false }));
      if (callback) callback();
    });
  };

  if (!state.visible) return null;

  const isStacked = state.buttons && state.buttons.length > 2;

  return (
    <Modal transparent visible={state.visible} animationType="none" onRequestClose={() => {
      if (state.options?.cancelable !== false) {
        handleClose(state.options?.onDismiss);
      }
    }}>
      <View style={styles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.alertBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.title}>{state.title}</Text>
          {!!state.message && <Text style={styles.message}>{state.message}</Text>}
          
          <View style={[styles.buttonContainer, isStacked && styles.buttonContainerStacked]}>
            {state.buttons?.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive && index === state.buttons!.length - 1;
              const isTwoButtons = !isStacked && state.buttons!.length === 2;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isTwoButtons && { flex: 1 },
                    isStacked && { width: '100%' },
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    isPrimary && styles.buttonPrimary,
                  ]}
                  onPress={() => handleClose(btn.onPress)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel && styles.buttonTextCancel,
                    isDestructive && styles.buttonTextDestructive,
                    isPrimary && styles.buttonTextPrimary,
                  ]}>
                    {btn.text || 'OK'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '400',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  buttonContainerStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    backgroundColor: '#F3F4F6',
  },
  buttonPrimary: {
    backgroundColor: '#16A34A',
  },
  buttonCancel: {
    backgroundColor: '#F3F4F6',
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextCancel: {
    color: '#4B5563',
  },
  buttonTextDestructive: {
    color: '#FFFFFF',
  },
});
