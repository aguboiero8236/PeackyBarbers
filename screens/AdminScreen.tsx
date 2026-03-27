import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, AppointmentSlot } from '../types';
import { getAllBookings } from '../services/bookingService';
import { formatDate, formatDisplayDate } from '../data/mockData';

type AdminScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Admin'>;
};

const ADMIN_PIN = '1234';

const generateDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

export default function AdminScreen({ navigation }: AdminScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [bookings, setBookings] = useState<AppointmentSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const bookedDates = useMemo(() => {
    const uniqueDates = [...new Set(bookings.map(b => b.date))];
    const filteredDates = uniqueDates.filter(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
    return filteredDates.sort();
  }, [bookings]);

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setIsAuthenticated(true);
    } else {
      Alert.alert('Error', 'PIN incorrecto');
      setPin('');
    }
  };

  const loadBookings = async () => {
    const data = await getAllBookings();
    setBookings(data);
    
    if (data.length > 0) {
      const uniqueDates = [...new Set(data.map(b => b.date))];
      const filteredDates = uniqueDates.filter(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      }).sort();
      
      if (filteredDates.length > 0) {
        setSelectedDate(filteredDates[0]);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadBookings().then(() => setRefreshKey(prev => prev + 1));
      }
    }, [isAuthenticated])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const renderDate = (dateStr: string) => {
    const isSelected = dateStr === selectedDate;
    const dateObj = new Date(dateStr);
    
    return (
      <TouchableOpacity
        key={dateStr}
        style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
        onPress={() => setSelectedDate(dateStr)}
      >
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
          {formatDisplayDate(dateObj)}
        </Text>
      </TouchableOpacity>
    );
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => booking.date === selectedDate);
  }, [bookings, selectedDate, refreshKey]);

  const renderBooking = ({ item }: { item: AppointmentSlot }) => {
    return (
      <View style={[styles.slotButton, styles.slotButtonBooked]}>
        <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
        <Text style={styles.slotStatus}>
          {item.bookedBy?.name || 'Reservado'} - {item.bookedBy?.phone || ''}
        </Text>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backButton}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Admin</Text>
        </View>
        
        <View style={styles.pinContainer}>
          <Text style={styles.pinTitle}>Ingrese el PIN</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="****"
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.pinButton} onPress={handlePinSubmit}>
            <Text style={styles.pinButtonText}>Ingresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reservas</Text>
      </View>
      
      <View style={styles.dateContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bookedDates.map(renderDate)}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.slotsContainer}
        ListEmptyComponent={
          <Text style={styles.noSlots}>No hay reservas</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    color: '#d4af37',
    fontSize: 16,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#d4af37',
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pinTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  pinInput: {
    width: 200,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pinButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  dateButtonSelected: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#1a1a1a',
  },
  slotsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  slotButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  slotButtonBooked: {
    backgroundColor: '#222',
    borderColor: '#333',
    opacity: 0.8,
  },
  slotTime: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  slotStatus: {
    fontSize: 14,
    color: '#fff',
  },
  noSlots: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
});
