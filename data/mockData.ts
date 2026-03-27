import { AppointmentSlot } from '../types';
import { saveBooking, getAllBookings } from '../services/bookingService';

const TIME_SLOTS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date): string => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

const generateSlots = (): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const today = new Date();
  
  for (let day = 0; day < 14; day++) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const dateStr = formatDate(date);
    
    TIME_SLOTS.forEach((time, index) => {
      slots.push({
        id: `${dateStr}-${time}`,
        date: dateStr,
        time: time,
        isBooked: false,
      });
    });
  }
  
  return slots;
};

export let appointmentSlots: AppointmentSlot[] = generateSlots();

export const initializeSlots = async (): Promise<void> => {
  const firestoreBookings = await getAllBookings();
  
  appointmentSlots = appointmentSlots.map(slot => {
    const booking = firestoreBookings.find(b => b.id === slot.id);
    if (booking) {
      return { ...slot, isBooked: true, bookedBy: booking.bookedBy };
    }
    return slot;
  });
};

export const getSlotsForDate = (date: string): AppointmentSlot[] => {
  return appointmentSlots.filter(slot => slot.date === date);
};

export const bookSlot = async (slotId: string, name: string, phone: string): Promise<boolean> => {
  const slotIndex = appointmentSlots.findIndex(s => s.id === slotId);
  if (slotIndex === -1 || appointmentSlots[slotIndex].isBooked) {
    return false;
  }
  
  const success = await saveBooking({
    slot: appointmentSlots[slotIndex],
    name,
    phone,
  });
  
  if (success) {
    appointmentSlots[slotIndex] = {
      ...appointmentSlots[slotIndex],
      isBooked: true,
      bookedBy: { name, phone },
    };
    return true;
  }
  
  return false;
};

export { formatDate, formatDisplayDate, TIME_SLOTS };
