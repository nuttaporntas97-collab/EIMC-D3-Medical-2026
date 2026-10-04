export type RoomNumber = 
  | '301' | '302' | '303' | '304' | '305' | '306' | '307' | '308' | '309' | '310'
  | '311' | '312' | '313' | '314' | '315' | '316' | '317' | '318' | '319' | '320'
  | '321' | '322' | '323';

export type BedNumber = '1' | '2';

export const ALL_ROOMS: RoomNumber[] = [
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310',
  '311', '312', '313', '314', '315', '316', '317', '318', '319', '320',
  '321', '322', '323'
];

export type PatientStatus = 'Admit' | 'Refer' | 'Death' | 'Moved' | 'Discharge';

export interface User {
  UserID: string;
  SAPUser: string;
  Password?: string;
  FirstName: string;
  LastName: string;
  Position: string;
  Status: 'ACTIVE' | 'INACTIVE';
  Role: 'ADMIN' | 'USER' | 'STAFF';
  CreatedAt: string;
}

export interface SessionUser {
  userId: string;
  sapUser: string;
  name: string;
  position: string;
  role: string;
}

export interface Patient {
  PatientID: string;
  HN: string;
  FirstName: string;
  LastName: string;
  Gender: 'ชาย' | 'หญิง';
  Room: RoomNumber;
  Bed: BedNumber;
  Status: PatientStatus;
  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Medicine {
  MedicineID: string;
  MedicineName: string;
  Unit: string;
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedBy: string;
  CreatedAt: string;
}

export interface Supply {
  SupplyID: string;
  SupplyName: string;
  Unit: string;
  Status: 'ACTIVE' | 'INACTIVE';
  CreatedBy: string;
  CreatedAt: string;
}

export interface RelativePurchase {
  PurchaseID: string;
  PatientID: string;
  HN: string;
  Room: RoomNumber;
  Bed: BedNumber;
  ItemName: string;
  Quantity: number;
  Note: string;
  CreatedBy: string;
  CreatedAt: string;
  Status: string;
}

export type ItemType = 'MEDICINE' | 'SUPPLY';

export interface PendingItem {
  PendingID: string;
  PatientID: string;
  HN: string;
  Room: RoomNumber;
  Bed: BedNumber;
  ItemType: ItemType;
  ItemID: string;
  ItemName: string;
  Quantity: number;
  RequestedBy: string;
  RequestedAt: string;
  Status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  GroupID?: string;
}

export interface DispenseOrder {
  OrderID: string;
  PatientID: string;
  HN: string;
  Room: RoomNumber;
  Bed: BedNumber;
  CreatedBy: string;
  CreatedAt: string;
  ConfirmedBy: string;
  ConfirmedAt: string;
  Status: 'PENDING' | 'CONFIRMED' | 'PRINTED';
}

export interface DispenseOrderItem {
  OrderItemID: string;
  OrderID: string;
  PendingID: string;
  ItemType: ItemType;
  ItemID: string;
  ItemName: string;
  Quantity: number;
  RequestedBy: string;
  RequestedAt: string;
}

export interface HistoryItem {
  HistoryID: string;
  OrderID: string;
  PatientID: string;
  HN: string;
  Room: RoomNumber;
  Bed: BedNumber;
  ItemType: ItemType;
  ItemName: string;
  Quantity: number;
  RequestedBy: string;
  ConfirmedBy: string;
  CreatedAt: string;
  ConfirmedAt: string;
  Status: string;
}

export type AppPage =
  | 'index'
  | 'login'
  | 'register'
  | 'main'
  | 'patient'
  | 'patient-add'
  | 'patient-edit'
  | 'medicine'
  | 'supplies'
  | 'relative-purchase'
  | 'pending'
  | 'pending-detail'
  | 'dispense-print'
  | 'history'
  | 'history-detail'
  | 'settings';
