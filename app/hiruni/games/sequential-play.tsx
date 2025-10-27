import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  BackHandler,
  Alert,
  ScrollView,
} from 'react-native';
import { Play, CircleCheck as CheckCircle, Clock } from 'lucide-react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { GameStartAnimation } from '@/components/IT21838248/GameAnimations';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

const games = [
  {
    id: 1,
    title: 'Letter Tracing',
    route: '/games/letter-tracing',
    color: '#A3C4F3',
    description: 'Trace letters with your finger',
  },
  {
    id: 2,
    title: 'Sound & Letters',
    route: '/games/sound-letter',
    color: '#B7E4C7',
    description: 'Match sounds with letters',
  },
  {
    id: 3,
    title: 'Same or Different',
    route: '/games/same-different',
    color: '#FFF3B0',
    description: 'Find the correct letter',
  },
  {
    id: 4,
    title: 'Letter Hunt',
    route: '/games/letter-hunt',
    color: '#CDB4DB',
    description: 'Find hidden letters',
  },
  {
    id: 5,
    title: 'Color Matching',
    route: '/games/color-matching',
    color: '#FFD6A5',
    description: 'Remember and match colors',
  },
];

export default function SequentialPlayScreen() {
  const { sequence, currentIndex } = useLocalSearchParams();
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [completedGames, setCompletedGames] = useState<number[]>([]);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [showStartAnimation, setShowStartAnimation] = useState(false);

  const gameSequence = sequence
    ? JSON.parse(sequence as string)
    : GAME_WEIGHTS.slice()
        .sort((a:any, b:any) => a.weight - b.weight)
        .map((g:any) => g.gameId);

  useEffect(() => {
    if (currentIndex) {
      const index = parseInt(currentIndex as string);
      if (index < gameSequence.length) {
        setCurrentGameIndex(index);
      } else {
        router.push('/hiruni/games/final-results');
      }
    }
  }, [currentIndex]);

  const currentGameId = gameSequence[currentGameIndex];
  const currentGame = games.find((game) => game.id === currentGameId);

  useEffect(() => {
    startPulseAnimation();

    // Show start animation only for the first game in the sequence
    if (currentGameIndex === 0) {
      setShowStartAnimation(true);
    }
  }, []);

  const handleStartAnimationComplete = () => {
    setShowStartAnimation(false);
  };

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

  const startCurrentGame = () => {
    if (currentGame) {
      router.push({
        pathname: currentGame.route as any,
        params: {
          sequential: 'true',
          nextGameIndex: (currentGameIndex + 1).toString(),
        },
      });
    }
  };

  const skipCurrentGame = () => {
    Speech.speak("No worries! Let's move to the next fun game!");

    setCompletedGames((prev) => [...prev, currentGameId]);

    if (currentGameIndex < gameSequence.length - 1) {
      const nextIndex = currentGameIndex + 1;
      router.replace({
        pathname: '/hiruni/games/sequential-play',
        params: {
          sequence: JSON.stringify(gameSequence),
          currentIndex: nextIndex.toString(),
        },
      });
    } else {
      router.push('/hiruni/games/final-results');
    }
  };

  if (!currentGame) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Game not found!</Text>
      </View>
    );
  }

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the app?',
          [
            { text: 'Cancel', onPress: () => null, style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: false }
        );
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView>
      <GameStartAnimation
        visible={showStartAnimation && currentGameIndex === 0}
        onComplete={handleStartAnimationComplete}
        title="Let's Start Learning!"
      />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Your Learning Journey</Text>
        <View style={styles.progressBar}>
          {gameSequence.map((gameId:any, index:any) => (
            <View
              key={gameId}
              style={[
                styles.progressDot,
                index < currentGameIndex && styles.progressDotCompleted,
                index === currentGameIndex && styles.progressDotCurrent,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressText}>
          Game {currentGameIndex + 1} of {gameSequence.length}
        </Text>
      </View>

      {/* Current Game Display */}
      <Animated.View
        style={[
          styles.gameCard,
          {
            backgroundColor: currentGame.color,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.gameHeader}>
          <Text style={styles.gameNumber}>Game {currentGameIndex + 1}</Text>
          <Clock size={24} color="#fff" />
        </View>

        <Text style={styles.gameTitle}>{currentGame.title}</Text>
        <Text style={styles.gameDescription}>{currentGame.description}</Text>

        <View style={styles.gameActions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={startCurrentGame}
          >
            <Play size={30} color="#fff" />
            <Text style={styles.playButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Game List */}
      <View style={styles.gamesList}>
        <Text style={styles.gamesListTitle}>All Games:</Text>
        {gameSequence.map((gameId:any, index:any) => {
          const game = games.find((g) => g.id === gameId);
          if (!game) return null;

          return (
            <View
              key={gameId}
              style={[
                styles.gameListItem,
                index === currentGameIndex && styles.gameListItemCurrent,
                completedGames.includes(gameId) && styles.gameListItemCompleted,
              ]}
            >
              <View style={styles.gameListInfo}>
                <Text
                  style={[
                    styles.gameListTitle,
                    index === currentGameIndex && styles.gameListTitleCurrent,
                  ]}
                >
                  {index + 1}. {game.title}
                </Text>
              </View>

              {completedGames.includes(gameId) && (
                <CheckCircle size={20} color="#4CAF50" />
              )}

              {index === currentGameIndex && (
                <View style={styles.currentIndicator}>
                  <Text style={styles.currentText}>Current</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={skipCurrentGame}>
          <Text style={styles.skipButtonText}>Skip This Game</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E8D5B7',
    marginHorizontal: 8,
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressDotCurrent: {
    backgroundColor: '#FF6B6B',
    transform: [{ scale: 1.3 }],
  },
  progressText: {
    fontSize: 16,
    color: '#A67B5B',
  },
  gameCard: {
    borderRadius: 25,
    padding: 30,
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  gameNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
  },
  gameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  gameDescription: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 25,
  },
  gameActions: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 14,
    letterSpacing: 1,
  },
  gamesList: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  gamesListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 15,
  },
  gameListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  gameListItemCurrent: {
    backgroundColor: '#FFF3B0',
  },
  gameListItemCompleted: {
    backgroundColor: '#E8F5E8',
  },
  gameListInfo: {
    flex: 1,
  },
  gameListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A2B',
  },
  gameListTitleCurrent: {
    fontWeight: 'bold',
  },
  currentIndicator: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  currentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  skipButton: {
    backgroundColor: '#FFD6A5',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 20,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 100,
  },
});
