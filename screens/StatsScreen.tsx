import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AppointmentSlot } from '../types';
import { getAllBookings, getUnavailableSlots } from '../services/bookingService';

type StatsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Stats'>;
};

const ADMIN_PIN = '0212';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color || '#d4af37' }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    lastWeek: 0,
    lastMonth: 0,
    lastYear: 0,
    total: 0,
    unavailableLastWeek: 0,
    unavailableLastMonth: 0,
    unavailableLastYear: 0,
    unavailableTotal: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      console.log('Loading bookings and unavailable slots...');
      const bookings = await getAllBookings();
      console.log('Bookings loaded:', bookings.length);
      const unavailable = await getUnavailableSlots();
      console.log('Unavailable loaded:', unavailable.length);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);

      let lastWeek = 0;
      let lastMonth = 0;
      let lastYear = 0;
      let unavailableLastWeek = 0;
      let unavailableLastMonth = 0;
      let unavailableLastYear = 0;

      bookings.forEach(booking => {
        const [year, month, day] = booking.date.split('-').map(Number);
        const bookingDate = new Date(year, month - 1, day);
        
        if (bookingDate >= weekAgo) {
          lastWeek++;
        }
        if (bookingDate >= monthAgo) {
          lastMonth++;
        }
        if (bookingDate >= yearAgo) {
          lastYear++;
        }
      });

      unavailable.forEach(slot => {
        const [year, month, day] = slot.date.split('-').map(Number);
        const slotDate = new Date(year, month - 1, day);
        
        if (slotDate >= weekAgo) {
          unavailableLastWeek++;
        }
        if (slotDate >= monthAgo) {
          unavailableLastMonth++;
        }
        if (slotDate >= yearAgo) {
          unavailableLastYear++;
        }
      });

      setStats({
        lastWeek,
        lastMonth,
        lastYear,
        total: bookings.length,
        unavailableLastWeek,
        unavailableLastMonth,
        unavailableLastYear,
        unavailableTotal: unavailable.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGoToReservas = () => {
    navigation.navigate('Admin', { isPreAuthenticated: true });
  };

  const weeklyAverage = useMemo(() => {
    if (stats.lastMonth > 0) {
      return (stats.lastMonth / 4).toFixed(1);
    }
    return '0';
  }, [stats.lastMonth]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Estadísticas</Text>
        <TouchableOpacity onPress={handleGoToReservas}>
          <Text style={styles.reservasButton}>Reservas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d4af37" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Resumen de Turnos</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Última Semana"
              value={stats.lastWeek}
              subtitle="Últimos 7 días"
              color="#27ae60"
            />
            <StatCard
              title="Último Mes"
              value={stats.lastMonth}
              subtitle="Últimos 30 días"
              color="#3498db"
            />
            <StatCard
              title="Último Año"
              value={stats.lastYear}
              subtitle="Últimos 365 días"
              color="#9b59b6"
            />
            <StatCard
              title="Total Histórico"
              value={stats.total}
              subtitle="Todos los turnos"
              color="#d4af37"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Turnos No Disponibles</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Última Semana"
              value={stats.unavailableLastWeek}
              subtitle="No disponibles"
              color="#e74c3c"
            />
            <StatCard
              title="Último Mes"
              value={stats.unavailableLastMonth}
              subtitle="No disponibles"
              color="#e67e22"
            />
            <StatCard
              title="Último Año"
              value={stats.unavailableLastYear}
              subtitle="No disponibles"
              color="#c0392b"
            />
            <StatCard
              title="Total Histórico"
              value={stats.unavailableTotal}
              subtitle="No disponibles"
              color="#e74c3c"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Promedios</Text>
          
          <View style={styles.averagesContainer}>
            <View style={styles.averageRow}>
              <Text style={styles.averageLabel}>Promedio semanal (último mes)</Text>
              <Text style={styles.averageValue}>{weeklyAverage} turnos/semana</Text>
            </View>
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 24,
  },
  averagesContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  averageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 14,
    color: '#888',
  },
  averageValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
  },
  statsButton: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '600',
  },
  reservasButton: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '600',
    marginLeft: 16,
  },
});
