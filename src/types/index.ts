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
  floorPlanId?: string | null;
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

// ─── Floor Plan types ─────────────────────────────────────────────────────────

export interface IFloorPlanCell {
  row: number;
  col: number;
}

/** A table group within a floor plan (as stored in DB) */
export interface IFloorPlanTable {
  tableNumber: number;
  tableDocId: string; // references a thin Table document
  cells: IFloorPlanCell[];
}

/** Floor plan with optional `available` field added by the API */
export interface IFloorPlanTableWithAvailability extends IFloorPlanTable {
  available: boolean;
}

export interface IFloorPlan {
  _id: string;
  restaurant: string;
  name: string;
  rows: number;
  cols: number;
  northLabel: string;
  southLabel: string;
  eastLabel: string;
  westLabel: string;
  tables: IFloorPlanTable[];
  createdAt: string;
  updatedAt: string;
}

/** Floor plan as returned by the availability API (tables include `available`) */
export interface IFloorPlanWithAvailability extends Omit<IFloorPlan, "tables"> {
  tables: IFloorPlanTableWithAvailability[];
}
