import React, { useEffect } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { resetVirtualControls, setVirtualControl } from './controls';

function ControlButton({ action, label, style, textStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action}
      onPressIn={() => setVirtualControl(action, true)}
      onPressOut={() => setVirtualControl(action, false)}
      onTouchCancel={() => setVirtualControl(action, false)}
      style={({ pressed }) => [styles.button, style, pressed && styles.buttonPressed]}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export default function MobileControls() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') resetVirtualControls();
    });
    return () => {
      subscription.remove();
      resetVirtualControls();
    };
  }, []);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.dpad}>
        <View style={styles.dpadRow}>
          <View style={styles.spacer} />
          <ControlButton action="forward" label="▲" />
          <View style={styles.spacer} />
        </View>
        <View style={styles.dpadRow}>
          <ControlButton action="left" label="◀" />
          <View style={styles.center} />
          <ControlButton action="right" label="▶" />
        </View>
        <View style={styles.dpadRow}>
          <View style={styles.spacer} />
          <ControlButton action="backward" label="▼" />
          <View style={styles.spacer} />
        </View>
      </View>

      <ControlButton
        action="jump"
        label="JUMP"
        style={styles.jump}
        textStyle={styles.jumpText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 10,
  },
  dpad: {
    width: 138,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  dpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  spacer: { width: 40, height: 40 },
  center: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(2, 6, 23, 0.5)' },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  buttonPressed: {
    backgroundColor: '#4f46e5',
    borderColor: '#a5b4fc',
  },
  buttonText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  jump: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(79, 70, 229, 0.94)',
    borderColor: 'rgba(165, 180, 252, 0.8)',
    borderWidth: 2,
  },
  jumpText: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#ffffff',
  },
});
