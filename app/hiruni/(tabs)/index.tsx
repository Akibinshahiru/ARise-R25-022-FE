import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Play,
  Gamepad2,
  BookOpen,
  Eye,
  Search,
  Palette,
} from 'lucide-react-native';
import { router } from 'expo-router';
import AgeConfirmationModal from '@/components/IT21838248/AgeConfirmationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Game {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  route: string;
  rounds: number;
}

const games: Game[] = [
  {
    id: 1,
    title: 'Letter Tracing',
    description: 'Trace letters with your finger',
    icon: <BookOpen size={40} color="#fff" />,
    color: '#A3C4F3',
    route: '/games/letter-tracing',
    rounds: 3,
  },
  {
    id: 2,
    title: 'Sound & Letters',
    description: 'Match sounds with letters',
    icon: <Play size={40} color="#fff" />,
    color: '#B7E4C7',
    route: '/games/sound-letter',
    rounds: 2,
  },
  {
    id: 3,
    title: 'Same or Different',
    description: 'Find the correct letter',
    icon: <Eye size={40} color="#fff" />,
    color: '#FFF3B0',
    route: '/games/same-different',
    rounds: 2,
  },
  {
    id: 4,
    title: 'Letter Hunt',
    description: 'Find hidden letters in the grid',
    icon: <Search size={40} color="#fff" />,
    color: '#CDB4DB',
    route: '/games/letter-hunt',
    rounds: 2,
  },
  {
    id: 5,
    title: 'Color Matching',
    description: 'Remember and match colors',
    icon: <Palette size={40} color="#fff" />,
    color: '#FFD6A5',
    route: '/games/color-matching',
    rounds: 3,
  },
];

export default function HomePage() {
  const [userName, setUserName] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showAgeConfirmation, setShowAgeConfirmation] = useState(false);

  useEffect(() => {
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSequentialPlay = () => {
    setShowAgeConfirmation(true);
  };

  const resetAccount = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userName',
        'userDOB',
        'userGender',
        'gameProgress',
      ]);
      router.replace('/hiruni/registration');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to reset profile data.');
    }
  };
  const handleAgeConfirmationAccept = () => {
    setShowAgeConfirmation(false);
    resetAccount();
    router.push('/hiruni/registration');
  };

  const handleAgeConfirmationCancel = () => {
    setShowAgeConfirmation(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Hello, {userName || 'Little Star'}! 🌟
        </Text>
        <Text style={styles.subtitleText}>Ready to play some fun games?</Text>
      </View>

      <Animated.View
        style={[styles.playAllButton, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          onPress={startSequentialPlay}
          style={styles.playAllTouchable}
        >
          <Gamepad2 size={30} color="#fff" />
          <Text style={styles.playAllText}>Play All Games!</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={styles.gamesContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Available Games:</Text>
        {games.map((game, index) => (
          <View
            key={game.id}
            style={[styles.gameCard, { backgroundColor: game.color }]}
          >
            <View style={styles.gameIconContainer}>{game.icon}</View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              <Text style={styles.gameRounds}>{game.rounds} rounds</Text>
            </View>
            <View style={styles.playButton}>
              <Play size={24} color="#fff" />
            </View>
          </View>
        ))}
      </ScrollView>

      <AgeConfirmationModal
        visible={showAgeConfirmation}
        onConfirm={handleAgeConfirmationAccept}
        onCancel={handleAgeConfirmationCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    color: '#A67B5B',
    textAlign: 'center',
  },
  playAllButton: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  playAllTouchable: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playAllText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  gamesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B5A2B',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  gameIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 3,
  },
  gameRounds: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
