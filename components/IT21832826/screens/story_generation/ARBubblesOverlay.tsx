import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

type Props = {
  children?: React.ReactNode;
};

export default function ARBubblesOverlay({ children }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.granted]);

  if (!permission) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <ActivityIndicator size="large" color="#6d28d9" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.center]}> 
        <ActivityIndicator size="large" color="#6d28d9" />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});

