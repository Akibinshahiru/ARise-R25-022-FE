import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { User, Calendar, Users, Trash } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const dob = await AsyncStorage.getItem('userDOB');
      const gender = await AsyncStorage.getItem('userGender');

      setUserData({
        name: name || '',
        dateOfBirth: dob || '',
        gender: gender || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const resetAccount = async () => {
    try {
      await AsyncStorage.multiRemove(['userName', 'userDOB', 'userGender']);
      router.replace('/hiruni/registration');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to reset profile data.');
    }
  };

  const ProfileField = ({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
  }: any) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A67B5B"
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={60} color="#8B5A2B" />
        </View>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        <ProfileField
          icon={<User size={24} color="#8B5A2B" />}
          label="Name"
          value={userData.name}
          onChangeText={(text: string) =>
            setUserData((prev) => ({ ...prev, name: text }))
          }
          placeholder="Enter your name"
        />

        <ProfileField
          icon={<Calendar size={24} color="#8B5A2B" />}
          label="Date of Birth"
          value={userData.dateOfBirth}
          onChangeText={(text: string) =>
            setUserData((prev) => ({ ...prev, dateOfBirth: text }))
          }
          placeholder="DD/MM/YYYY"
        />

        <ProfileField
          icon={<Users size={24} color="#8B5A2B" />}
          label="Gender"
          value={userData.gender}
          onChangeText={(text: string) =>
            setUserData((prev) => ({ ...prev, gender: text }))
          }
          placeholder="Boy/Girl/Other"
        />

        <TouchableOpacity style={styles.editButton} onPress={resetAccount}>
          <Trash size={24} color="#fff" />
          <Text style={styles.editButtonText}>Reset Account</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8D5B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5A2B',
  },
  profileContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fieldContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5A2B',
    marginLeft: 10,
  },
  fieldValue: {
    fontSize: 18,
    color: '#333',
    paddingLeft: 34,
  },
  textInput: {
    fontSize: 18,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8D5B7',
    borderRadius: 8,
    padding: 10,
    marginLeft: 34,
  },
  editButton: {
    backgroundColor: '#A3C4F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
});
