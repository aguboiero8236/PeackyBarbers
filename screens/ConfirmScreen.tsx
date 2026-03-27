import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { bookSlot } from '../data/mockData';
import { translations } from '../i18n';

const t = translations.confirm;

type ConfirmScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Confirm'>;
  route: RouteProp<RootStackParamList, 'Confirm'>;
};

const formatDateDisplay = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function ConfirmScreen({ navigation, route }: ConfirmScreenProps) {
  const { booking } = route.params;
  
  useEffect(() => {
    bookSlot(booking.slot.id, booking.name, booking.phone).catch(console.error);
  }, [booking]);

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
        
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
        
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.name}</Text>
            <Text style={styles.detailValue}>{booking.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.phone}</Text>
            <Text style={styles.detailValue}>{booking.phone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.date}</Text>
            <Text style={styles.detailValue}>{formatDateDisplay(booking.slot.date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.time}</Text>
            <Text style={styles.detailValueHighlight}>{formatTime(booking.slot.time)}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>{t.done}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 80,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  checkmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmarkText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
  },
  detailValueHighlight: {
    fontSize: 18,
    color: '#d4af37',
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#d4af37',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
