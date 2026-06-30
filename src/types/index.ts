// Shared TypeScript types for the application

export type UserRole = "CUSTOMER" | "OWNER" | "ADMIN";

export type RestaurantStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRestaurant {
  _id: string;
  name: string;
  description: string;
  cuisine: string;
  address: string;
  city: string;
  phone: string;
  logo?: string;
  coverImage?: string;
  status: RestaurantStatus;
  owner: string | IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ITable {
  _id: string;
  number: number;
  capacity: number;
  restaurant: string | IRestaurant;
  createdAt: string;
  updatedAt: string;
}

export interface IMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  restaurant: string | IRestaurant;
  createdAt: string;
  updatedAt: string;
}

export interface IReservation {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  user: string | IUser;
  table: string | ITable;
  restaurant: string | IRestaurant;
  createdAt: string;
  updatedAt: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
