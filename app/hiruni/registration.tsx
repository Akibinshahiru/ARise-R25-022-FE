import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  User,
  Calendar,
  Users,
  ArrowRight,
  Star,
  Heart,
  Smile,
} from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DataPermissionModal from '@/components/IT21838248/DataPermissionModal';
import { GAME_WEIGHTS } from '@/config/IT21838248/gameConfig';

const { width, height } = Dimensions.get('window');

const gameSequence = GAME_WEIGHTS.slice()
  .sort((a:any, b:any) => a.weight - b.weight)
  .map((g:any) => g.gameId);
export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [showDataPermission, setShowDataPermission] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
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
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const nextStep = () => {
    if (currentStep === 0 && !formData.name.trim()) {
      Alert.alert('Oops! 😊', 'Please enter your name first!');
      return;
    }
    if (currentStep === 1 && !formData.dateOfBirth.trim()) {
      Alert.alert('Oops! 🎂', 'Please enter your birthday!');
      return;
    }

    if (currentStep < 2) {
      Animated.timing(slideAnim, {
        toValue: -(currentStep + 1) * width,
        duration: 400,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep + 1);
    }
  };

  const selectGender = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }));

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setFormData((prev) => ({ ...prev, gender }));
      setShowDataPermission(true);
    });
  };

  const handleDataPermissionAccept = async () => {
    setShowDataPermission(false);
    await saveAndContinue(formData);
  };

  const handleDataPermissionDecline = () => {
    setShowDataPermission(false);
    setFormData((prev) => ({ ...prev, gender: '' }));
  };

  const saveAndContinue = async (data: any) => {
    if (!data.name.trim() || !data.dateOfBirth.trim() || !data.gender) {
      Alert.alert('Oops!', 'Please fill in all information! 😊');
      return;
    }

    try {
      await AsyncStorage.setItem('userName', data.name);
      await AsyncStorage.setItem('userDOB', data.dateOfBirth);
      await AsyncStorage.setItem('userGender', data.gender);

      router.replace({
        pathname: '/hiruni/games/sequential-play',
        params: {
          sequence: JSON.stringify(gameSequence),
          currentIndex: '0',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const GenderButton = ({ gender, emoji, selected }: any) => (
    <TouchableOpacity
      style={[styles.genderButton, selected && styles.genderButtonSelected]}
      onPress={() => selectGender(gender)}
    >
      <Text style={styles.genderEmoji}>{emoji}</Text>
      <Text style={[styles.genderText, selected && styles.genderTextSelected]}>
        {gender}
      </Text>
    </TouchableOpacity>
  );

  const steps = [
    {
      title: "What's your name?",
      subtitle: "Tell us what you'd like to be called! 😊",
      content: (
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <User size={28} color="#8B5A2B" />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Your name here..."
            placeholderTextColor="#A67B5B"
            value={formData.name}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, name: text }))
            }
            autoFocus
            onSubmitEditing={nextStep}
          />
        </View>
      ),
      showNext: formData.name.trim().length > 0,
    },
    {
      title: "When's your birthday?",
      subtitle: "We'd love to know! 🎂",
      content: (
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Calendar size={28} color="#8B5A2B" />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#A67B5B"
            value={formData.dateOfBirth}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, dateOfBirth: text }))
            }
            autoFocus
            onSubmitEditing={nextStep}
          />
        </View>
      ),
      showNext: formData.dateOfBirth.trim().length > 0,
    },
    {
      title: 'Are you a boy or girl?',
      subtitle: 'Choose what feels right for you! 👦👧',
      content: (
        <View style={styles.genderContainer}>
          <GenderButton
            gender="Boy"
            emoji="👦"
            selected={formData.gender === 'Boy'}
          />
          <GenderButton
            gender="Girl"
            emoji="👧"
            selected={formData.gender === 'Girl'}
          />
          <GenderButton
            gender="Other"
            emoji="🌟"
            selected={formData.gender === 'Other'}
          />
        </View>
      ),
      showNext: false,
    },
  ];

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
        <Star size={25} color="#A3C4F3" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.topRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Heart size={22} color="#CDB4DB" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.bottomLeft,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Smile size={30} color="#B7E4C7" />
      </Animated.View>

      <Animated.View
        style={[
          styles.decorativeElement,
          styles.bottomRight,
          { transform: [{ rotate: spin }] },
        ]}
      >
        <Star size={26} color="#FFD6A5" />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <View style={[styles.stepContainer, { width: width * steps.length }]}>
            {steps.map((step, index) => (
              <View key={index} style={[styles.step, { width }]}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

                <View style={styles.contentContainer}>{step.content}</View>

                {step.showNext && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={nextStep}
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                    <ArrowRight size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <DataPermissionModal
        visible={showDataPermission}
        onAccept={handleDataPermissionAccept}
        onDecline={handleDataPermissionDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3DD',
  },
  decorativeElement: {
    position: 'absolute',
    zIndex: 1,
  },
  topLeft: {
    top: height * 0.1,
    left: width * 0.1,
  },
  topRight: {
    top: height * 0.12,
    right: width * 0.12,
  },
  bottomLeft: {
    bottom: height * 0.15,
    left: width * 0.12,
  },
  bottomRight: {
    bottom: height * 0.18,
    right: width * 0.1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    zIndex: 2,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E8D5B7',
    marginHorizontal: 8,
  },
  progressDotActive: {
    backgroundColor: '#A3C4F3',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
    marginBottom: 15,
  },
  stepSubtitle: {
    fontSize: 20,
    color: '#A67B5B',
    textAlign: 'center',
    marginBottom: 40,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 16,
    width: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputIconContainer: {
    marginRight: 15,
    padding: 5,
  },
  textInput: {
    flex: 1,
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
    minWidth: 0,
  },
  nextButton: {
    backgroundColor: '#A3C4F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 35,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  genderContainer: {
    width: '100%',
    alignItems: 'center',
  },
  genderButton: {
    backgroundColor: '#fff',
    paddingVertical: 25,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 12,
    width: '85%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  genderButtonSelected: {
    backgroundColor: '#A3C4F3',
    elevation: 8,
    borderColor: '#8B5A2B',
    transform: [{ scale: 1.05 }],
  },
  genderEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  genderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  genderTextSelected: {
    color: '#fff',
  },
});
