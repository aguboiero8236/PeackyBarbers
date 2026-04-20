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
import { getAllBookings, getUnavailableSlots, setUnavailable, removeUnavailable } from '../services/bookingService';
import { formatDate, formatDisplayDate, cancelSlot, generateSlots } from '../data/mockData';

type AdminScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Admin'>;
  route: any;
};

const ADMIN_PIN = '0212';

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

export default function AdminScreen({ navigation, route }: AdminScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(route?.params?.isPreAuthenticated || false);
  const [pin, setPin] = useState('');
  const [bookings, setBookings] = useState<AppointmentSlot[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<AppointmentSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelItem, setCancelItem] = useState<AppointmentSlot | null>(null);
  const [currentView, setCurrentView] = useState<'bookings' | 'unavailable'>('bookings');
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [unavailableReason, setUnavailableReason] = useState('');
  const [actionItem, setActionItem] = useState<AppointmentSlot | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'cancel' | 'unavailable' | null>(null);

  const bookedDates = useMemo(() => {
    const allSlots = [...availableSlots, ...bookings, ...unavailableSlots];
    const uniqueDates = [...new Set(allSlots.map(b => b.date))];
    const filteredDates = uniqueDates.filter(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });
    return filteredDates.sort();
  }, [availableSlots, bookings, unavailableSlots]);

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
    const unavailable = await getUnavailableSlots();
    const today = new Date().toISOString().split('T')[0];
    const filteredData = data.filter(b => b.date >= today);
    const filteredUnavailable = unavailable.filter(b => b.date >= today);
    setBookings(filteredData);
    setUnavailableSlots(filteredUnavailable);
    
    const allGeneratedSlots = generateSlots().filter(s => s.date >= today);
    const bookedIds = new Set(filteredData.map(b => b.id));
    const unavailableIds = new Set(filteredUnavailable.map(u => u.id));
    
    const available = allGeneratedSlots
      .filter(s => !bookedIds.has(s.id) && !unavailableIds.has(s.id))
      .map(s => ({ ...s, isBooked: false }));
    setAvailableSlots(available);
    
    const allSlots = [...filteredData, ...filteredUnavailable, ...available];
    if (allSlots.length > 0) {
      const uniqueDates = [...new Set(allSlots.map(b => b.date))];
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

  const handleGoToStats = () => {
    navigation.navigate('Stats');
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

  const allSlotsForDate = useMemo(() => {
    return [...availableSlots, ...bookings]
      .filter(slot => slot.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [availableSlots, bookings, unavailableSlots, selectedDate, refreshKey]);

const handleCancelBooking = (item: AppointmentSlot) => {
    setActionItem(item);
    setActionType('cancel');
  };

  const handleToggleUnavailable = (item: AppointmentSlot) => {
    setActionItem(item);
    setActionType('unavailable');
  };

  const executeAction = () => {
    if (!actionItem || !actionType) return;
    
    if (actionType === 'cancel') {
      cancelSlot(actionItem.id).then((success) => {
        if (success) {
          loadBookings();
        }
      });
    } else if (actionType === 'unavailable') {
      const slotToSave = { ...actionItem, isUnavailable: true };
      setUnavailable(slotToSave, 'No disponible').then(() => {
        if (actionItem.bookedBy) {
          cancelSlot(actionItem.id).then(() => loadBookings());
        } else {
          loadBookings();
        }
      });
    }
    
    setActionItem(null);
    setActionType(null);
  };

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

  const confirmSetUnavailable = useCallback(async () => {
    if (!selectedSlot) return;
    
    setShowUnavailableModal(false);
    
    const slotToSave = { ...selectedSlot, isUnavailable: true };
    const success = await setUnavailable(slotToSave, unavailableReason);
    
    let cancelSuccess = true;
    if (selectedSlot.bookedBy) {
      cancelSuccess = await cancelSlot(selectedSlot.id);
    }
    
    if (success || cancelSuccess) {
      loadBookings();
    }
    
    setSelectedSlot(null);
    setUnavailableReason('');
  }, [selectedSlot, unavailableReason]);

  const confirmRemoveUnavailable = useCallback(async (item: AppointmentSlot) => {
    const success = await removeUnavailable(item);
    if (success) {
      const today = new Date().toISOString().split('T')[0];
      const data = (await getUnavailableSlots()).filter(b => b.date >= today);
      setUnavailableSlots(data);
    } else {
      Alert.alert('Error', 'No se pudo habilitar el turno');
    }
  }, []);

  const renderBooking = ({ item }: { item: AppointmentSlot }) => {
    return (
      <View style={[styles.slotButton, styles.slotButtonBooked]}>
        <TouchableOpacity 
          style={styles.bookingInfo}
          onPress={() => handleCancelBooking(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
          <Text style={styles.slotStatus}>
            {item.bookedBy?.name || 'Reservado'} - {item.bookedBy?.phone || ''}
          </Text>
        </TouchableOpacity>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.unavailableButton}
            onPress={() => {
              setSelectedSlot(item);
              setShowUnavailableModal(true);
            }}
          >
            <Text style={styles.unavailableButtonText}>∅</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}
          >
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSlot = ({ item }: { item: AppointmentSlot }) => {
    const isBooked = item.bookedBy !== undefined;
    const isUnavailable = item.isUnavailable;
    
    if (isUnavailable) {
      return (
        <View style={[styles.slotButton, styles.slotButtonUnavailable]}>
          <TouchableOpacity 
            style={styles.bookingInfo}
            onPress={() => handleToggleUnavailable(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
            <Text style={styles.slotStatus}>
              {item.unavailableReason || 'No disponible'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.enableButton}
            onPress={() => handleToggleUnavailable(item)}
          >
            <Text style={styles.enableButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (isBooked) {
      return (
        <View style={[styles.slotButton, styles.slotButtonBooked]}>
          <View style={styles.bookingInfo}>
            <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
            <Text style={styles.slotStatus}>
              {item.bookedBy?.name || 'Reservado'} - {item.bookedBy?.phone || ''}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.unavailableButton} onPress={() => handleToggleUnavailable(item)}>
              <Text style={styles.unavailableButtonText}>∅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelBooking(item)}>
              <Text style={styles.cancelButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[styles.slotButton, styles.slotButtonAvailable]}>
        <View style={styles.bookingInfo}>
          <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
          <Text style={styles.slotStatus}>Disponible</Text>
        </View>
<TouchableOpacity style={styles.unavailableButton} onPress={() => handleToggleUnavailable(item)}>
          <Text style={styles.unavailableButtonText}>∅</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUnavailable = ({ item }: { item: AppointmentSlot }) => {
    return (
      <View style={[styles.slotButton, styles.slotButtonUnavailable]}>
        <View style={styles.bookingInfo}>
          <Text style={styles.slotTime}>{formatTime(item.time)}</Text>
          <Text style={styles.slotStatus}>
            {item.unavailableReason || 'No disponible'}
          </Text>
        </View>
        <TouchableOpacity style={styles.enableButton} onPress={() => handleToggleUnavailable(item)}>
          <Text style={styles.enableButtonText}>✓</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>
          {currentView === 'bookings' ? 'Reservas' : 'No Disponibles'}
        </Text>
        <TouchableOpacity onPress={handleGoToStats}>
          <Text style={styles.statsButton}>Estadísticas</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'bookings' && styles.toggleButtonActive]}
          onPress={() => setCurrentView('bookings')}
        >
          <Text style={[styles.toggleText, currentView === 'bookings' && styles.toggleTextActive]}>
            Reservas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, currentView === 'unavailable' && styles.toggleButtonActive]}
          onPress={() => setCurrentView('unavailable')}
        >
          <Text style={[styles.toggleText, currentView === 'unavailable' && styles.toggleTextActive]}>
            No Disp.
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.dateContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {bookedDates.map(renderDate)}
        </ScrollView>
      </View>
      
      <FlatList
        data={currentView === 'bookings' ? allSlotsForDate : unavailableSlots.filter(s => s.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time))}
        renderItem={currentView === 'bookings' ? renderSlot : renderUnavailable}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.slotsContainer}
        ListEmptyComponent={
          <Text style={styles.noSlots}>
            {currentView === 'bookings' ? 'No hay turnos' : 'No hay turnos no disponibles'}
          </Text>
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

      <Modal
        visible={actionItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActionItem(null);
          setActionType(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'cancel' ? 'Cancelar Reserva' : 'No Disponible'}
            </Text>
            <Text style={styles.modalText}>
              {actionType === 'cancel' 
                ? `¿Cancelar la reserva de ${actionItem?.bookedBy?.name || 'este cliente'}?`
                : '¿Marcar este turno como no disponible?'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setActionItem(null);
                  setActionType(null);
                }}
              >
                <Text style={styles.modalButtonCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={executeAction}
              >
                <Text style={styles.modalButtonConfirmText}>Sí</Text>
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
    justifyContent: 'space-between',
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
statsButton: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '600',
    marginLeft: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  toggleButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  toggleText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#1a1a1a',
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
  slotButtonUnavailable: {
    backgroundColor: '#3a2a2a',
    borderColor: '#5a3a3a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotButtonAvailable: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
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
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unavailableButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unavailableButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  enableButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reasonInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
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
