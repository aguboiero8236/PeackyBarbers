import { addDoc, getDocs, query, orderBy, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { bookingsCollection, unavailableCollection } from '../firebase';
import { AppointmentSlot, BookingData } from '../types';

export const saveBooking = async (booking: BookingData): Promise<boolean> => {
  try {
    await addDoc(bookingsCollection, {
      slotId: booking.slot.id,
      date: booking.slot.date,
      time: booking.slot.time,
      customerName: booking.name,
      phone: booking.phone,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error saving booking:', error);
    return false;
  }
};

export const getAllBookings = async (): Promise<AppointmentSlot[]> => {
  try {
    const q = query(bookingsCollection, orderBy('date'), orderBy('time'));
    const querySnapshot = await getDocs(q);
    
    const bookings: AppointmentSlot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: data.slotId,
        date: data.date,
        time: data.time,
        isBooked: true,
        bookedBy: {
          name: data.customerName,
          phone: data.phone,
        },
      });
    });
    
    return bookings;
  } catch (error) {
    console.error('Error getting bookings:', error);
    return [];
  }
};

export const cancelBooking = async (slotId: string): Promise<boolean> => {
  try {
    const q = query(bookingsCollection);
    const querySnapshot = await getDocs(q);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.slotId === slotId) {
        await deleteDoc(doc(bookingsCollection, docSnapshot.id));
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error canceling booking:', error);
    return false;
  }
};

export const getUnavailableSlots = async (): Promise<AppointmentSlot[]> => {
  try {
    const querySnapshot = await getDocs(unavailableCollection);
    
    const slots: AppointmentSlot[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      slots.push({
        id: data.slotId,
        date: data.date,
        time: data.time,
        isBooked: false,
        isUnavailable: true,
        unavailableReason: data.reason || 'No disponible',
      });
    });
    
    slots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
    
    return slots;
  } catch (error) {
    console.error('Error getting unavailable slots:', error);
    return [];
  }
};

export const setUnavailable = async (slot: AppointmentSlot, reason: string): Promise<boolean> => {
  try {
    const slotId = `${slot.date}_${slot.time}`;
    await setDoc(doc(unavailableCollection, slotId), {
      slotId: slot.id,
      date: slot.date,
      time: slot.time,
      reason: reason,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error setting unavailable:', error);
    return false;
  }
};

export const removeUnavailable = async (slot: AppointmentSlot): Promise<boolean> => {
  try {
    const slotId = `${slot.date}_${slot.time}`;
    await deleteDoc(doc(unavailableCollection, slotId));
    return true;
  } catch (error) {
    console.error('Error removing unavailable:', error);
    return false;
  }
};
