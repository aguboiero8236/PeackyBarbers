import { addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { bookingsCollection } from '../firebase';
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
