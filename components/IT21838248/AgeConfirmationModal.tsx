import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  TriangleAlert as AlertTriangle,
  SquareCheck as CheckSquare,
  Square,
  Users,
  Calendar,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface AgeConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AgeConfirmationModal({
  visible,
  onConfirm,
  onCancel,
}: AgeConfirmationModalProps) {
  const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(
    null
  );
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedOption(null);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionSelect = (option: 'yes' | 'no') => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption === 'yes') {
      onConfirm();
    } else if (selectedOption === 'no') {
      onCancel();
    }
  };

  const OptionButton = ({
    option,
    label,
  }: {
    option: 'yes' | 'no';
    label: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        selectedOption === option && styles.optionButtonSelected,
      ]}
      onPress={() => handleOptionSelect(option)}
    >
      {selectedOption === option ? (
        <CheckSquare size={24} color="#4CAF50" />
      ) : (
        <Square size={24} color="#8B5A2B" />
      )}
      <Text
        style={[
          styles.optionText,
          selectedOption === option && styles.optionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}
        >
          {/* Warning Icon */}
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../../assets/animations/robot.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Age Confirmation</Text>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>
              Please note that this game series is designed for children aged
              from <Text style={styles.highlight}>minimum 2 years</Text> to{' '}
              <Text style={styles.highlight}>maximum 8 years</Text>.
            </Text>

            <View style={styles.ageInfoContainer}>
              <View style={styles.ageInfo}>
                <Users size={20} color="#8B5A2B" />
                <Text style={styles.ageInfoText}>Ages 2-8 years</Text>
              </View>
              <View style={styles.ageInfo}>
                <Calendar size={20} color="#8B5A2B" />
                <Text style={styles.ageInfoText}>Learning Assessment</Text>
              </View>
            </View>

            <Text style={styles.question}>
              Do you still wish to enroll and take part in this game series?
            </Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <OptionButton option="yes" label="Yes" />
            <OptionButton option="no" label="No" />
          </View>

          {/* Confirm Button */}
          {selectedOption && (
            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedOption === 'yes'
                  ? styles.confirmButtonYes
                  : styles.confirmButtonNo,
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>
                {selectedOption === 'yes' ? 'Continue' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lottieContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 20,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 30,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  ageInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  ageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInfoText: {
    fontSize: 14,
    color: '#8B5A2B',
    fontWeight: '600',
    marginLeft: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B5A2B',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A2B',
    marginLeft: 10,
  },
  optionTextSelected: {
    color: '#4CAF50',
  },
  confirmButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmButtonYes: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonNo: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
