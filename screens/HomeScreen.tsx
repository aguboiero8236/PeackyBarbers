import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { getSlotsForDate, formatDate, formatDisplayDate, initializeSlots } from '../data/mockData';
import { RootStackParamList, AppointmentSlot } from '../types';
import { translations } from '../i18n';
import { getUnavailableSlots } from '../services/bookingService';

const t = translations.home;

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const generateDates = (): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(date);
    }
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

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const dates = useMemo(() => generateDates(), []);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [unavailableSlots, setUnavailableSlots] = useState<AppointmentSlot[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      await initializeSlots();
      const unavailable = await getUnavailableSlots();
      setUnavailableSlots(unavailable);
      setIsLoading(false);
    };
    loadData().catch(console.error);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await initializeSlots();
        const unavailable = await getUnavailableSlots();
        setUnavailableSlots(unavailable);
        setRefreshKey(prev => prev + 1);
      };
      loadData().catch(console.error);
    }, [])
  );

  const slots = useMemo(() => {
    const allSlots = getSlotsForDate(selectedDate);
    const unavailableIds = new Set(unavailableSlots.map(u => u.id));
    return allSlots.map(slot => ({
      ...slot,
      isUnavailable: unavailableIds.has(slot.id),
    }));
  }, [selectedDate, refreshKey, unavailableSlots]);

  const handleSlotPress = (slot: AppointmentSlot) => {
    if (!slot.isBooked) {
      navigation.navigate('Booking', { slot });
    }
  };

  const handleAdminPress = () => {
    navigation.navigate('Admin', { isPreAuthenticated: false });
  };

  const renderDate = (date: Date) => {
    const dateStr = formatDate(date);
    const isSelected = dateStr === selectedDate;
    
    return (
      <TouchableOpacity
        key={dateStr}
        style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
        onPress={() => setSelectedDate(dateStr)}
      >
        <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
          {formatDisplayDate(date)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSlot = ({ item }: { item: AppointmentSlot }) => {
    const isAvailable = !item.isBooked && !item.isUnavailable;
    const isUnavailable = item.isUnavailable;
    
    const buttonStyle = [
      styles.slotButton,
      !isAvailable && styles.slotButtonBooked,
      isUnavailable && styles.slotButtonUnavailable,
    ];
    
    const timeStyle = [
      styles.slotTime,
      !isAvailable && styles.slotTimeBooked,
      isUnavailable && styles.slotTimeUnavailable,
    ];
    
    const statusStyle = [
      styles.slotStatus,
      !isAvailable && styles.slotStatusBooked,
      isUnavailable && styles.slotStatusUnavailable,
    ];
    
    const statusText = isUnavailable ? 'No disponible' : (isAvailable ? t.available : t.booked);
    
    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={() => handleSlotPress(item)}
        disabled={!isAvailable}
      >
        <Text style={timeStyle}>
          {formatTime(item.time)}
        </Text>
        <Text style={statusStyle}>
          {statusText}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleAdminPress} style={styles.logoButton}>
              <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>
      
      <View style={styles.dateContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dates.map(renderDate)}
        </ScrollView>
      </View>
      
      <FlatList
        data={slots}
        renderItem={renderSlot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.slotsContainer}
        ListEmptyComponent={
          <Text style={styles.noSlots}>{t.noSlots}</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  logoButton: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
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
    opacity: 0.6,
  },
  slotButtonUnavailable: {
    backgroundColor: '#3a2a2a',
    borderColor: '#5a3a3a',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  slotTimeBooked: {
    color: '#666',
  },
  slotTimeUnavailable: {
    color: '#666',
  },
  slotStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  slotStatusBooked: {
    color: '#f44336',
  },
  slotStatusUnavailable: {
    color: '#e67e22',
  },
  noSlots: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d4af37',
    fontSize: 18,
  },
});
