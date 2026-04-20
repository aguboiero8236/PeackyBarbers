export interface AppointmentSlot {
  id: string;
  date: string;
  time: string;
  isBooked: boolean;
  isUnavailable?: boolean;
  unavailableReason?: string;
  bookedBy?: {
    name: string;
    phone: string;
  };
}

export interface BookingData {
  slot: AppointmentSlot;
  name: string;
  phone: string;
}

export type RootStackParamList = {
  Home: undefined;
  Booking: { slot: AppointmentSlot };
  Confirm: { booking: BookingData };
  Admin: { isPreAuthenticated?: boolean };
  Stats: undefined;
};
