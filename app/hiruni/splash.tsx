import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Star, Heart, Smile } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    checkUserRegistration();
  }, []);

  const startAnimations = () => {
    // Main logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const checkUserRegistration = async () => {
    setTimeout(async () => {
      router.replace('/hiruni/(tabs)');
    }, 2500);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <Animated.View
        style={[
          styles.decorativeElement,
          styles.topLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={30} color="#FFD6A5" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.topRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Heart size={25} color="#CDB4DB" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.bottomLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Smile size={35} color="#B7E4C7" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.bottomRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={28} color="#FFF3B0" />
      </Animated.View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.mainLogo}>
          <Text style={styles.logoText}>📚</Text>
        </View>

        <Text style={styles.appName}>Learning Fun</Text>
        <Text style={styles.subtitle}>KidZo - Games for Amazing Kids! 🌟</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>Getting ready for fun...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeElement: {
    position: 'absolute',
  },
  topLeft: {
    top: height * 0.1,
    left: width * 0.1,
  },
  topRight: {
    top: height * 0.15,
    right: width * 0.15,
  },
  bottomLeft: {
    bottom: height * 0.2,
    left: width * 0.15,
  },
  bottomRight: {
    bottom: height * 0.25,
    right: width * 0.1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  mainLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#A67B5B',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A67B5B',
    fontStyle: 'italic',
  },
});
