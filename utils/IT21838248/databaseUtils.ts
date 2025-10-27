import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/config/IT21838248/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ChildAssessmentData {
  childName: string;
  dateOfBirth: string;
  gender: string;
  dateOfAssessment: string;
  game01Score: number;
  game02Score: number;
  game03Score: number;
  game04Score: number;
  game05Score: number;
  finalScore: number;
  diagnosis: string;
}

export class DatabaseService {
  private static COLLECTION_NAME = 'child_assessments';

  static async saveAssessmentData(data: ChildAssessmentData): Promise<boolean> {
    try {
      // Check if Firebase is configured
      if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
        console.log(
          'Firebase not configured. Skipping external database save.'
        );
        return true; // Return true to continue the flow
      }

      // Prepare the data for Firestore
      const assessmentData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add document to Firestore
      const docRef = await addDoc(
        collection(db, DatabaseService.COLLECTION_NAME),
        assessmentData
      );

      if (docRef.id) {
        console.log(
          'Assessment data saved to Firebase successfully:',
          docRef.id
        );
        return true;
      } else {
        console.error('Failed to save assessment data to Firebase');
        return false;
      }
    } catch (error) {
      console.error('Error saving assessment data to Firebase:', error);

      // Check if it's a network error or configuration error
      if (error instanceof Error) {
        if (
          error.message.includes('network') ||
          error.message.includes('offline')
        ) {
          console.log('Network error - data will be saved locally only');
          return true; // Continue the flow even if offline
        }
      }

      return false;
    }
  }

  static async prepareAssessmentData(): Promise<ChildAssessmentData | null> {
    try {
      // Get user data
      const userName = await AsyncStorage.getItem('userName');
      const userDOB = await AsyncStorage.getItem('userDOB');
      const userGender = await AsyncStorage.getItem('userGender');

      // Get game progress
      const progressData = await AsyncStorage.getItem('gameProgress');

      if (!userName || !userDOB || !userGender || !progressData) {
        console.error('Missing required data for assessment');
        return null;
      }

      const gameResults = JSON.parse(progressData);

      // Initialize scores
      let gameScores: { [key: number]: number } = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      // Extract scores for each game
      gameResults.forEach((result: any) => {
        if (result.gameId >= 1 && result.gameId <= 5) {
          gameScores[result.gameId] = result.score || 0;
        }
      });

      // Calculate weighted final score
      const { GAME_WEIGHTS } = await import('../../config/IT21838248/gameConfig');
      let finalScore = 0;

      GAME_WEIGHTS.forEach((weight) => {
        finalScore += (gameScores[weight.gameId] * weight.weight) / 100;
      });

      // Get diagnosis
      const { getScoreCategory } = await import('../../config/IT21838248/gameConfig');
      const category = getScoreCategory(Math.round(finalScore));

      const assessmentData: ChildAssessmentData = {
        childName: userName,
        dateOfBirth: userDOB,
        gender: userGender,
        dateOfAssessment: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        game01Score: gameScores[1],
        game02Score: gameScores[2],
        game03Score: gameScores[3],
        game04Score: gameScores[4],
        game05Score: gameScores[5],
        finalScore: Math.round(finalScore),
        diagnosis: `${category.category} - ${category.riskLevel}`,
      };

      return assessmentData;
    } catch (error) {
      console.error('Error preparing assessment data:', error);
      return null;
    }
  }
}
