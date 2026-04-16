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
  
  useEffect(() => {
    initializeSlots().then(() => setIsLoading(false)).catch(console.error);
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      initializeSlots().then(() => setRefreshKey(prev => prev + 1)).catch(console.error);
    }, [])
  );

  const slots = useMemo(() => getSlotsForDate(selectedDate), [selectedDate, refreshKey]);

  const handleSlotPress = (slot: AppointmentSlot) => {
    if (!slot.isBooked) {
      navigation.navigate('Booking', { slot });
    }
  };

  const handleAdminPress = () => {
    navigation.navigate('Admin');
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
    const isAvailable = !item.isBooked;
    
    return (
      <TouchableOpacity
        style={[styles.slotButton, !isAvailable && styles.slotButtonBooked]}
        onPress={() => handleSlotPress(item)}
        disabled={!isAvailable}
      >
        <Text style={[styles.slotTime, !isAvailable && styles.slotTimeBooked]}>
          {formatTime(item.time)}
        </Text>
        <Text style={[styles.slotStatus, !isAvailable && styles.slotStatusBooked]}>
          {isAvailable ? t.available : t.booked}
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
    backgroundColor: '#0f172a',
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
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  dateTextSelected: {
    color: '#fff',
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
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  slotButtonBooked: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    opacity: 0.6,
  },
  slotTime: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  slotTimeBooked: {
    color: '#64748b',
  },
  slotStatus: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  slotStatusBooked: {
    color: '#ef4444',
  },
  noSlots: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    marginTop: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#3b82f6',
    fontSize: 18,
  },
});
