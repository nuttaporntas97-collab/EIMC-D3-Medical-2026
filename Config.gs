/**
 * EIMC D3 Medical - Configuration
 * Google Sheets Database Setup
 */

var CONFIG = {
  SPREADSHEET_NAME: 'EIMC D3 Medical Database',
  SHEETS: {
    USERS: 'Users',
    PATIENTS: 'Patients',
    MEDICINES: 'Medicines',
    SUPPLIES: 'Supplies',
    RELATIVE_PURCHASES: 'RelativePurchases',
    PENDING_ITEMS: 'PendingItems',
    DISPENSE_ORDERS: 'DispenseOrders',
    DISPENSE_ORDER_ITEMS: 'DispenseOrderItems',
    HISTORY: 'History'
  },
  HEADERS: {
    Users: ['UserID', 'SAPUser', 'Password', 'FirstName', 'LastName', 'Position', 'Status', 'Role', 'CreatedAt'],
    Patients: ['PatientID', 'HN', 'FirstName', 'LastName', 'Gender', 'Room', 'Bed', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt'],
    Medicines: ['MedicineID', 'MedicineName', 'Unit', 'Status', 'CreatedBy', 'CreatedAt'],
    Supplies: ['SupplyID', 'SupplyName', 'Unit', 'Status', 'CreatedBy', 'CreatedAt'],
    RelativePurchases: ['PurchaseID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemName', 'Quantity', 'Note', 'CreatedBy', 'CreatedAt', 'Status'],
    PendingItems: ['PendingID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemType', 'ItemID', 'ItemName', 'Quantity', 'RequestedBy', 'RequestedAt', 'Status', 'GroupID'],
    DispenseOrders: ['OrderID', 'PatientID', 'HN', 'Room', 'Bed', 'CreatedBy', 'CreatedAt', 'ConfirmedBy', 'ConfirmedAt', 'Status'],
    DispenseOrderItems: ['OrderItemID', 'OrderID', 'PendingID', 'ItemType', 'ItemID', 'ItemName', 'Quantity', 'RequestedBy', 'RequestedAt'],
    History: ['HistoryID', 'OrderID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemType', 'ItemName', 'Quantity', 'RequestedBy', 'ConfirmedBy', 'CreatedAt', 'ConfirmedAt', 'Status']
  }
};
