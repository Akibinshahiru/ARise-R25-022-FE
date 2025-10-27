import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { Shield, SquareCheck as CheckSquare, Square, Database, Lock } from 'lucide-react-native';

interface DataPermissionModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DataPermissionModal({
  visible,
  onAccept,
  onDecline,
}: DataPermissionModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHasAccepted(false);
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

  const toggleAcceptance = () => {
    setHasAccepted(!hasAccepted);
  };

  const handleEnroll = () => {
    if (hasAccepted) {
      onAccept();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDecline}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={40} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Data Privacy & Consent</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Database size={20} color="#8B5A2B" />
                <Text style={styles.infoText}>
                  Game performance data will be collected
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Lock size={20} color="#8B5A2B" />
                <Text style={styles.infoText}>
                  Data is used solely for dyslexia assessment
                </Text>
              </View>
            </View>

            <View style={styles.purposeContainer}>
              <Text style={styles.purposeTitle}>What we collect:</Text>
              <Text style={styles.purposeText}>
                • Child's name, date of birth, and gender{'\n'}
                • Game scores and performance metrics{'\n'}
                • Assessment results and diagnosis{'\n'}
                • Date of assessment
              </Text>
            </View>

            <View style={styles.purposeContainer}>
              <Text style={styles.purposeTitle}>How we use it:</Text>
              <Text style={styles.purposeText}>
                • To provide accurate dyslexia risk assessment{'\n'}
                • To improve our assessment algorithms{'\n'}
                • To enhance the app's effectiveness{'\n'}
                • For research purposes (anonymized data only)
              </Text>
            </View>

            <View style={styles.securityNote}>
              <Text style={styles.securityText}>
                🔒 Your child's data is encrypted and stored securely. We never share personal information with third parties.
              </Text>
            </View>
          </ScrollView>

          {/* Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentContainer}
            onPress={toggleAcceptance}
          >
            {hasAccepted ? (
              <CheckSquare size={24} color="#4CAF50" />
            ) : (
              <Square size={24} color="#8B5A2B" />
            )}
            <Text style={styles.consentText}>
              I give permission for the collection and use of my child's game-related data solely for the purpose of dyslexia assessment and improvement of this app.
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.enrollButton,
                !hasAccepted && styles.enrollButtonDisabled,
              ]}
              onPress={handleEnroll}
              disabled={!hasAccepted}
            >
              <Text
                style={[
                  styles.enrollButtonText,
                  !hasAccepted && styles.enrollButtonTextDisabled,
                ]}
              >
                ENROLL
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 25,
    width: '100%',
    maxWidth: 450,
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B5A2B',
    textAlign: 'center',
  },
  contentContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#8B5A2B',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  purposeContainer: {
    marginBottom: 15,
  },
  purposeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5A2B',
    marginBottom: 8,
  },
  purposeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  securityNote: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  securityText: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '500',
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  consentText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 0.4,
    elevation: 3,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enrollButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    flex: 0.55,
    elevation: 3,
  },
  enrollButtonDisabled: {
    backgroundColor: '#CCCCCC',
    elevation: 1,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enrollButtonTextDisabled: {
    color: '#999',
  },
});