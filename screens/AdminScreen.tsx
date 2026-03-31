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
  Modal,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, AppointmentSlot } from '../types';
import { getAllBookings } from '../services/bookingService';
import { formatDate, formatDisplayDate, cancelSlot } from '../data/mockData';

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelItem, setCancelItem] = useState<AppointmentSlot | null>(null);

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
    const today = new Date().toISOString().split('T')[0];
    const filteredData = data.filter(b => b.date >= today);
    setBookings(filteredData);
    
    if (filteredData.length > 0) {
      const uniqueDates = [...new Set(filteredData.map(b => b.date))];
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
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
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

  const handleCancelBooking = useCallback((item: AppointmentSlot) => {
    setCancelItem(item);
    setShowCancelModal(true);
  }, []);

  const confirmCancelBooking = useCallback(async () => {
    if (!cancelItem) return;
    
    setShowCancelModal(false);
    
    const success = await cancelSlot(cancelItem.id);
    if (success) {
      const today = new Date().toISOString().split('T')[0];
      const data = (await getAllBookings()).filter(b => b.date >= today);
      setBookings(data);
    } else {
      Alert.alert('Error', 'No se pudo cancelar la reserva');
    }
    
    setCancelItem(null);
  }, [cancelItem]);

  const renderBooking = ({ item }: { item: AppointmentSlot }) => {
    return (
      <TouchableOpacity 
        style={[styles.slotButton, styles.slotButtonBooked]}
        onPress={() => handleCancelBooking(item)}
        activeOpacity={0.8}
      >
        <View style={styles.bookingInfo}>
          <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
          <Text style={styles.slotStatus}>
            {item.bookedBy?.name || 'Reservado'} - {item.bookedBy?.phone || ''}
          </Text>
        </View>
        <View style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>✕</Text>
        </View>
      </TouchableOpacity>
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

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancelar Reserva</Text>
            <Text style={styles.modalText}>
              Cancelar reserva de {cancelItem?.bookedBy?.name || 'este cliente'}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmCancelBooking}
              >
                <Text style={styles.modalButtonConfirmText}>Si</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  bookingInfo: {
    flex: 1,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noSlots: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#444',
    marginRight: 8,
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    backgroundColor: '#e74c3c',
    marginLeft: 8,
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
