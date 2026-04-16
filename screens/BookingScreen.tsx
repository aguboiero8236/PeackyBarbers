import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, BookingData } from '../types';
import { translations } from '../i18n';

const t = translations.booking;

type BookingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Booking'>;
  route: RouteProp<RootStackParamList, 'Booking'>;
};

const formatDateDisplay = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]}`;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function BookingScreen({ navigation, route }: BookingScreenProps) {
  const { slot } = route.params;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!name.trim()) {
      setError(t.errorName);
      return;
    }
    if (!phone.trim()) {
      setError(t.errorPhone);
      return;
    }
    
    const booking: BookingData = {
      slot,
      name: name.trim(),
      phone: phone.trim(),
    };
    
    navigation.navigate('Confirm', { booking });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver al menú</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t.selectedTime}</Text>
          <Text style={styles.summaryDate}>{formatDateDisplay(slot.date)}</Text>
          <Text style={styles.summaryTime}>{formatTime(slot.time)}</Text>
        </View>
        
        <View style={styles.form}>
          <Text style={styles.inputLabel}>{t.name}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            placeholder={t.namePlaceholder}
            placeholderTextColor="#64748b"
            autoCapitalize="words"
          />
          
          <Text style={styles.inputLabel}>{t.phone}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            placeholder={t.phonePlaceholder}
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
          />
          
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t.confirmButton}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  summaryDate: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryTime: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
