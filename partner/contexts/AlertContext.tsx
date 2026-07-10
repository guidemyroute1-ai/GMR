import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { BlurView } from 'expo-blur';

type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export const AlertService = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    console.warn('AlertService not initialized yet');
  },
};

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertOptions | null>(null);

  // Fade animation for modal
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setConfig({ title, message, buttons });
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // Expose imperatively
  React.useEffect(() => {
    AlertService.alert = showAlert;
  }, [showAlert]);

  const hideAlert = useCallback((callback?: () => void | Promise<void>) => {
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
      }),
    ]).start(() => {
      setVisible(false);
      setConfig(null);
      if (callback) callback();
    });
  }, [fadeAnim, scaleAnim]);

  // Handle button press
  const handleButtonPress = (btn: AlertButton) => {
    hideAlert(btn.onPress);
  };

  // Render buttons
  const renderButtons = () => {
    if (!config) return null;

    let buttons = config.buttons;
    // Default to OK button if none provided
    if (!buttons || buttons.length === 0) {
      buttons = [{ text: 'OK', style: 'default' }];
    }

    return (
      <View style={styles.buttonContainer}>
        {buttons.map((btn, index) => {
          const isCancel = btn.style === 'cancel';
          const isDestructive = btn.style === 'destructive';

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.button,
                isCancel && styles.buttonCancel,
                isDestructive && styles.buttonDestructive,
                buttons.length > 2 && { width: '100%', marginTop: index > 0 ? 8 : 0 },
                buttons.length <= 2 && index > 0 && { marginLeft: 12 },
              ]}
              onPress={() => handleButtonPress(btn)}
            >
              <Text
                style={[
                  styles.buttonText,
                  isCancel && styles.buttonTextCancel,
                  isDestructive && styles.buttonTextDestructive,
                ]}
              >
                {btn.text || 'OK'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {visible && (
        <Modal transparent visible={visible} animationType="none">
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
            <Animated.View style={[styles.alertBox, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.title}>{config?.title}</Text>
              {!!config?.message && <Text style={styles.message}>{config.message}</Text>}
              {renderButtons()}
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </AlertContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alertBox: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  button: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.inputBg,
  },
  buttonDestructive: {
    backgroundColor: '#FEE2E2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  buttonTextCancel: {
    color: Colors.textMuted,
  },
  buttonTextDestructive: {
    color: Colors.danger,
  },
});
