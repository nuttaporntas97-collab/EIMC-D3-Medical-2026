import { getAccessToken } from './firebaseAuth';
import {
  User,
  Patient,
  Medicine,
  Supply,
  RelativePurchase,
  PendingItem,
  DispenseOrder,
  DispenseOrderItem,
  HistoryItem,
  SessionUser
} from '../types';

const DATABASE_NAME = 'EIMC D3 Medical Database';

const SHEET_NAMES = {
  USERS: 'Users',
  PATIENTS: 'Patients',
  MEDICINES: 'Medicines',
  SUPPLIES: 'Supplies',
  RELATIVE_PURCHASES: 'RelativePurchases',
  PENDING_ITEMS: 'PendingItems',
  DISPENSE_ORDERS: 'DispenseOrders',
  DISPENSE_ORDER_ITEMS: 'DispenseOrderItems',
  HISTORY: 'History'
};

const HEADERS: Record<string, string[]> = {
  Users: ['UserID', 'SAPUser', 'Password', 'FirstName', 'LastName', 'Position', 'Status', 'Role', 'CreatedAt'],
  Patients: ['PatientID', 'HN', 'FirstName', 'LastName', 'Gender', 'Room', 'Bed', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt'],
  Medicines: ['MedicineID', 'MedicineName', 'Unit', 'Status', 'CreatedBy', 'CreatedAt'],
  Supplies: ['SupplyID', 'SupplyName', 'Unit', 'Status', 'CreatedBy', 'CreatedAt'],
  RelativePurchases: ['PurchaseID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemName', 'Quantity', 'Note', 'CreatedBy', 'CreatedAt', 'Status'],
  PendingItems: ['PendingID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemType', 'ItemID', 'ItemName', 'Quantity', 'RequestedBy', 'RequestedAt', 'Status', 'GroupID'],
  DispenseOrders: ['OrderID', 'PatientID', 'HN', 'Room', 'Bed', 'CreatedBy', 'CreatedAt', 'ConfirmedBy', 'ConfirmedAt', 'Status'],
  DispenseOrderItems: ['OrderItemID', 'OrderID', 'PendingID', 'ItemType', 'ItemID', 'ItemName', 'Quantity', 'RequestedBy', 'RequestedAt'],
  History: ['HistoryID', 'OrderID', 'PatientID', 'HN', 'Room', 'Bed', 'ItemType', 'ItemName', 'Quantity', 'RequestedBy', 'ConfirmedBy', 'CreatedAt', 'ConfirmedAt', 'Status']
};

// Initial Seed Data (Empty - Real data will be saved to Google Sheets)
const DEFAULT_USERS: User[] = [];
const DEFAULT_MEDICINES: Medicine[] = [];
const DEFAULT_SUPPLIES: Supply[] = [];
const DEFAULT_PATIENTS: Patient[] = [];

// In-Memory Shared Cache
class GoogleSheetsDatabase {
  private spreadsheetId: string | null = null;
  private spreadsheetUrl: string | null = null;
  private isInitializing: boolean = false;
  private appsScriptUrl: string = '';

  // Local synced stores (initially empty)
  public users: User[] = [];
  public patients: Patient[] = [];
  public medicines: Medicine[] = [];
  public supplies: Supply[] = [];
  public relativePurchases: RelativePurchase[] = [];
  public pendingItems: PendingItem[] = [];
  public dispenseOrders: DispenseOrder[] = [];
  public dispenseOrderItems: DispenseOrderItem[] = [];
  public history: HistoryItem[] = [];

  constructor() {
    // Load cached spreadsheetId if available
    const savedId = localStorage.getItem('eimc_spreadsheet_id');
    if (savedId) this.spreadsheetId = savedId;
    const savedUrl = localStorage.getItem('eimc_apps_script_url');
    if (savedUrl) this.appsScriptUrl = savedUrl;
  }

  public getSpreadsheetId(): string | null {
    return this.spreadsheetId;
  }

  public getSpreadsheetUrl(): string | null {
    return this.spreadsheetId 
      ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit` 
      : this.spreadsheetUrl;
  }

  public setAppsScriptUrl(url: string) {
    this.appsScriptUrl = url.trim();
    localStorage.setItem('eimc_apps_script_url', this.appsScriptUrl);
  }

  public getAppsScriptUrl(): string {
    return this.appsScriptUrl;
  }

  // --- GOOGLE SHEETS API CALLS ---
  private async fetchGoogleApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google เพื่อเชื่อมต่อฐานข้อมูล Google Sheets');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.error?.message || `HTTP error ${res.status}`;
      throw new Error(`Google Sheets API Error: ${msg}`);
    }

    return res.json();
  }

  private async fetchDriveApi(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    if (!token) return null;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) return null;
    return res.json();
  }

  // Initialize or find the Spreadsheet in Google Sheets
  public async initSpreadsheet(forceNew: boolean = false): Promise<string> {
    if (this.isInitializing) return this.spreadsheetId || '';
    this.isInitializing = true;

    try {
      const token = await getAccessToken();
      if (!token) {
        this.isInitializing = false;
        return '';
      }

      // Check if we can find an existing file with DATABASE_NAME
      if (!this.spreadsheetId || forceNew) {
        const driveSearch = await this.fetchDriveApi(
          `/files?q=name='${encodeURIComponent(DATABASE_NAME)}' and trashed=false&fields=files(id,name,webViewLink)`
        );

        if (driveSearch && driveSearch.files && driveSearch.files.length > 0 && !forceNew) {
          this.spreadsheetId = driveSearch.files[0].id;
          this.spreadsheetUrl = driveSearch.files[0].webViewLink;
          localStorage.setItem('eimc_spreadsheet_id', this.spreadsheetId!);
        } else {
          // Create new spreadsheet
          const newSheet = await this.fetchGoogleApi('', {
            method: 'POST',
            body: JSON.stringify({
              properties: {
                title: DATABASE_NAME
              },
              sheets: Object.keys(SHEET_NAMES).map(key => ({
                properties: {
                  title: (SHEET_NAMES as any)[key]
                }
              }))
            })
          });

          this.spreadsheetId = newSheet.spreadsheetId;
          this.spreadsheetUrl = newSheet.spreadsheetUrl;
          localStorage.setItem('eimc_spreadsheet_id', this.spreadsheetId!);

          // Populate headers and seed data
          await this.writeHeadersAndSeedData();
        }
      }

      // Load all data from Google Sheets into local cache
      await this.syncAllData();
      return this.spreadsheetId!;
    } catch (err) {
      console.warn('Google Sheets init error, using current cache:', err);
      return this.spreadsheetId || '';
    } finally {
      this.isInitializing = false;
    }
  }

  private async writeHeadersAndSeedData() {
    if (!this.spreadsheetId) return;

    for (const [sheetName, headerRow] of Object.entries(HEADERS)) {
      try {
        const values: any[][] = [headerRow];

        await this.fetchGoogleApi(`/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({
            range: `${sheetName}!A1`,
            values
          })
        });
      } catch (err) {
        console.error(`Failed to initialize headers for ${sheetName}:`, err);
      }
    }
  }

  // Pull all data from Google Sheets into client cache
  public async syncAllData(): Promise<{ success: boolean; message: string }> {
    if (!this.spreadsheetId) {
      await this.initSpreadsheet();
      if (!this.spreadsheetId) {
        return { success: false, message: 'ยังไม่ได้เชื่อมต่อ Google Sheets Database' };
      }
    }

    try {
      const ranges = Object.values(SHEET_NAMES).map(name => `${name}!A1:Z500`);
      const batchResult = await this.fetchGoogleApi(
        `/${this.spreadsheetId}/values:batchGet?ranges=${ranges.map(encodeURIComponent).join('&ranges=')}`
      );

      if (batchResult && batchResult.valueRanges) {
        for (const range of batchResult.valueRanges) {
          const rangeName = (range.range || '').split('!')[0].replace(/'/g, '');
          const rows = range.values || [];
          if (rows.length <= 1) continue; // Only header

          const dataRows = rows.slice(1);

          switch (rangeName) {
            case SHEET_NAMES.USERS:
              this.users = dataRows.map((r: any[]) => ({
                UserID: String(r[0] || ''),
                SAPUser: String(r[1] || ''),
                Password: String(r[2] || ''),
                FirstName: String(r[3] || ''),
                LastName: String(r[4] || ''),
                Position: String(r[5] || ''),
                Status: (r[6] || 'ACTIVE') as any,
                Role: (r[7] || 'USER') as any,
                CreatedAt: String(r[8] || '')
              }));
              break;

            case SHEET_NAMES.PATIENTS:
              this.patients = dataRows.map((r: any[]) => ({
                PatientID: String(r[0] || ''),
                HN: String(r[1] || ''),
                FirstName: String(r[2] || ''),
                LastName: String(r[3] || ''),
                Gender: (r[4] || 'ชาย') as any,
                Room: String(r[5] || '301') as any,
                Bed: String(r[6] || '1') as any,
                Status: (r[7] || 'Admit') as any,
                CreatedBy: String(r[8] || ''),
                CreatedAt: String(r[9] || ''),
                UpdatedAt: String(r[10] || '')
              }));
              break;

            case SHEET_NAMES.MEDICINES:
              this.medicines = dataRows.map((r: any[]) => ({
                MedicineID: String(r[0] || ''),
                MedicineName: String(r[1] || ''),
                Unit: String(r[2] || 'เม็ด'),
                Status: (r[3] || 'ACTIVE') as any,
                CreatedBy: String(r[4] || ''),
                CreatedAt: String(r[5] || '')
              }));
              break;

            case SHEET_NAMES.SUPPLIES:
              this.supplies = dataRows.map((r: any[]) => ({
                SupplyID: String(r[0] || ''),
                SupplyName: String(r[1] || ''),
                Unit: String(r[2] || 'ชิ้น'),
                Status: (r[3] || 'ACTIVE') as any,
                CreatedBy: String(r[4] || ''),
                CreatedAt: String(r[5] || '')
              }));
              break;

            case SHEET_NAMES.RELATIVE_PURCHASES:
              this.relativePurchases = dataRows.map((r: any[]) => ({
                PurchaseID: String(r[0] || ''),
                PatientID: String(r[1] || ''),
                HN: String(r[2] || ''),
                Room: String(r[3] || '301') as any,
                Bed: String(r[4] || '1') as any,
                ItemName: String(r[5] || ''),
                Quantity: Number(r[6] || 1),
                Note: String(r[7] || ''),
                CreatedBy: String(r[8] || ''),
                CreatedAt: String(r[9] || ''),
                Status: String(r[10] || 'ACTIVE')
              }));
              break;

            case SHEET_NAMES.PENDING_ITEMS:
              this.pendingItems = dataRows
                .map((r: any[]) => ({
                  PendingID: String(r[0] || ''),
                  PatientID: String(r[1] || ''),
                  HN: String(r[2] || ''),
                  Room: String(r[3] || '301') as any,
                  Bed: String(r[4] || '1') as any,
                  ItemType: (r[5] || 'MEDICINE') as any,
                  ItemID: String(r[6] || ''),
                  ItemName: String(r[7] || ''),
                  Quantity: Number(r[8] || 1),
                  RequestedBy: String(r[9] || ''),
                  RequestedAt: String(r[10] || ''),
                  Status: (r[11] || 'PENDING') as any,
                  GroupID: String(r[12] || '')
                }))
                .filter((p: PendingItem) => p.Status === 'PENDING');
              break;

            case SHEET_NAMES.DISPENSE_ORDERS:
              this.dispenseOrders = dataRows.map((r: any[]) => ({
                OrderID: String(r[0] || ''),
                PatientID: String(r[1] || ''),
                HN: String(r[2] || ''),
                Room: String(r[3] || '301') as any,
                Bed: String(r[4] || '1') as any,
                CreatedBy: String(r[5] || ''),
                CreatedAt: String(r[6] || ''),
                ConfirmedBy: String(r[7] || ''),
                ConfirmedAt: String(r[8] || ''),
                Status: (r[9] || 'CONFIRMED') as any
              }));
              break;

            case SHEET_NAMES.HISTORY:
              this.history = dataRows.map((r: any[]) => ({
                HistoryID: String(r[0] || ''),
                OrderID: String(r[1] || ''),
                PatientID: String(r[2] || ''),
                HN: String(r[3] || ''),
                Room: String(r[4] || '301') as any,
                Bed: String(r[5] || '1') as any,
                ItemType: (r[6] || 'MEDICINE') as any,
                ItemName: String(r[7] || ''),
                Quantity: Number(r[8] || 1),
                RequestedBy: String(r[9] || ''),
                ConfirmedBy: String(r[10] || ''),
                CreatedAt: String(r[11] || ''),
                ConfirmedAt: String(r[12] || ''),
                Status: String(r[13] || 'เบิกแล้ว')
              }));
              break;
          }
        }
      }

      return { success: true, message: 'ซิงค์ข้อมูลกับ Google Sheets สำเร็จ' };
    } catch (err: any) {
      console.warn('Sync failed:', err);
      return { success: false, message: err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้' };
    }
  }

  private async appendRowToSheet(sheetName: string, rowValues: any[]) {
    if (!this.spreadsheetId) return;
    try {
      await this.fetchGoogleApi(`/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        body: JSON.stringify({
          values: [rowValues]
        })
      });
    } catch (err) {
      console.error(`Failed to append row to ${sheetName}:`, err);
    }
  }

  // --- ACTIONS ---

  // 1. Login
  public async login(sapUser: string, password: string): Promise<{ success: boolean; message: string; user?: SessionUser }> {
    const cleanUser = sapUser.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'กรุณากรอก SAP User และรหัสผ่าน' };
    }

    // Try finding in current memory first
    let user = this.users.find(u => u.SAPUser.toLowerCase() === cleanUser.toLowerCase());

    // If not found or if Google is connected, try refreshing
    if (!user && this.spreadsheetId) {
      await this.syncAllData();
      user = this.users.find(u => u.SAPUser.toLowerCase() === cleanUser.toLowerCase());
    }

    if (!user) {
      return { success: false, message: `ไม่พบผู้ใช้งาน ${cleanUser} ในระบบ` };
    }

    if (user.Password !== cleanPass) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
    }

    if (user.Status !== 'ACTIVE') {
      return { success: false, message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' };
    }

    const session: SessionUser = {
      userId: user.UserID,
      sapUser: user.SAPUser,
      name: `${user.FirstName} ${user.LastName}`,
      position: user.Position,
      role: user.Role
    };

    return { success: true, message: 'เข้าสู่ระบบสำเร็จ', user: session };
  }

  // 2. Register
  public async register(userData: {
    sapUser: string;
    password: string;
    firstName: string;
    lastName: string;
    position: string;
  }): Promise<{ success: boolean; message: string }> {
    const sapUser = userData.sapUser.trim();
    if (!sapUser || !userData.password || !userData.firstName || !userData.lastName) {
      return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' };
    }

    // Check duplicate
    if (this.users.some(u => u.SAPUser.toLowerCase() === sapUser.toLowerCase())) {
      return { success: false, message: 'SAP User นี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น' };
    }

    const userId = `U${String(this.users.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newUser: User = {
      UserID: userId,
      SAPUser: sapUser,
      Password: userData.password,
      FirstName: userData.firstName.trim(),
      LastName: userData.lastName.trim(),
      Position: userData.position.trim() || 'พยาบาล',
      Status: 'ACTIVE',
      Role: 'USER',
      CreatedAt: now
    };

    this.users.push(newUser);

    // Save to Google Sheets
    await this.appendRowToSheet(SHEET_NAMES.USERS, [
      newUser.UserID,
      newUser.SAPUser,
      newUser.Password,
      newUser.FirstName,
      newUser.LastName,
      newUser.Position,
      newUser.Status,
      newUser.Role,
      newUser.CreatedAt
    ]);

    return { success: true, message: 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที' };
  }

  // 3. Patients
  public async addPatient(patientData: Omit<Patient, 'PatientID' | 'CreatedAt' | 'UpdatedAt'>): Promise<{ success: boolean; message: string; patient?: Patient }> {
    const hn = patientData.HN.trim();
    const firstName = patientData.FirstName.trim();
    const lastName = patientData.LastName.trim();

    if (!hn || !firstName || !lastName || !patientData.Room || !patientData.Bed) {
      return { success: false, message: 'กรุณากรอกข้อมูลผู้ป่วยให้ครบถ้วน (HN, ชื่อ, นามสกุล, ห้อง, เตียง)' };
    }

    // Check if bed already occupied
    const occupied = this.patients.find(
      p => p.Room === patientData.Room && p.Bed === patientData.Bed && p.Status === 'Admit'
    );
    if (occupied) {
      return { success: false, message: `ห้อง ${patientData.Room} เตียง ${patientData.Bed} มีผู้ป่วย Admit อยู่แล้ว (${occupied.FirstName} ${occupied.LastName})` };
    }

    // Check HN uniqueness
    const duplicateHN = this.patients.find(p => p.HN === hn && p.Status === 'Admit');
    if (duplicateHN) {
      return { success: false, message: `HN ${hn} กำลัง Admit อยู่ในระบบแล้ว` };
    }

    const patientId = `P${String(this.patients.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newPatient: Patient = {
      PatientID: patientId,
      HN: hn,
      FirstName: firstName,
      LastName: lastName,
      Gender: patientData.Gender,
      Room: patientData.Room,
      Bed: patientData.Bed,
      Status: patientData.Status || 'Admit',
      CreatedBy: patientData.CreatedBy,
      CreatedAt: now,
      UpdatedAt: now
    };

    this.patients.unshift(newPatient);

    await this.appendRowToSheet(SHEET_NAMES.PATIENTS, [
      newPatient.PatientID,
      newPatient.HN,
      newPatient.FirstName,
      newPatient.LastName,
      newPatient.Gender,
      newPatient.Room,
      newPatient.Bed,
      newPatient.Status,
      newPatient.CreatedBy,
      newPatient.CreatedAt,
      newPatient.UpdatedAt
    ]);

    return { success: true, message: 'บันทึกข้อมูลผู้ป่วยสำเร็จ', patient: newPatient };
  }

  public async updatePatient(patient: Patient): Promise<{ success: boolean; message: string }> {
    const idx = this.patients.findIndex(p => p.PatientID === patient.PatientID);
    if (idx === -1) {
      return { success: false, message: 'ไม่พบผู้ป่วยที่ต้องการแก้ไข' };
    }

    // Check if bed conflict
    const occupied = this.patients.find(
      p => p.PatientID !== patient.PatientID && p.Room === patient.Room && p.Bed === patient.Bed && p.Status === 'Admit' && patient.Status === 'Admit'
    );
    if (occupied) {
      return { success: false, message: `ห้อง ${patient.Room} เตียง ${patient.Bed} มีผู้ป่วย Admit อยู่แล้ว` };
    }

    const now = new Date().toISOString();
    this.patients[idx] = { ...patient, UpdatedAt: now };

    // Rewrite patients to sheet
    if (this.spreadsheetId) {
      try {
        const rows = [
          HEADERS.Patients,
          ...this.patients.map(p => [
            p.PatientID, p.HN, p.FirstName, p.LastName, p.Gender, p.Room, p.Bed, p.Status, p.CreatedBy, p.CreatedAt, p.UpdatedAt
          ])
        ];
        await this.fetchGoogleApi(`/${this.spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.PATIENTS)}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ range: `${SHEET_NAMES.PATIENTS}!A1`, values: rows })
        });
      } catch (err) {
        console.error('Update patient sync error:', err);
      }
    }

    return { success: true, message: 'แก้ไขข้อมูลผู้ป่วยสำเร็จ' };
  }

  public async deletePatient(patientId: string): Promise<{ success: boolean; message: string }> {
    const idx = this.patients.findIndex(p => p.PatientID === patientId);
    if (idx === -1) {
      return { success: false, message: 'ไม่พบข้อมูลผู้ป่วย' };
    }
    this.patients.splice(idx, 1);

    if (this.spreadsheetId) {
      try {
        const rows = [
          HEADERS.Patients,
          ...this.patients.map(p => [
            p.PatientID, p.HN, p.FirstName, p.LastName, p.Gender, p.Room, p.Bed, p.Status, p.CreatedBy, p.CreatedAt, p.UpdatedAt
          ])
        ];
        await this.fetchGoogleApi(`/${this.spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.PATIENTS)}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ range: `${SHEET_NAMES.PATIENTS}!A1`, values: rows })
        });
      } catch (err) {
        console.error('Delete patient sync error:', err);
      }
    }

    return { success: true, message: 'ลบข้อมูลผู้ป่วยสำเร็จ' };
  }

  // 4. Medicines
  public async addMedicine(name: string, unit: string, createdBy: string): Promise<{ success: boolean; message: string; medicine?: Medicine }> {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, message: 'กรุณากรอกชื่อยา' };

    const medId = `M${String(this.medicines.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newMed: Medicine = {
      MedicineID: medId,
      MedicineName: cleanName,
      Unit: unit.trim() || 'เม็ด',
      Status: 'ACTIVE',
      CreatedBy: createdBy,
      CreatedAt: now
    };

    this.medicines.push(newMed);
    await this.appendRowToSheet(SHEET_NAMES.MEDICINES, [
      newMed.MedicineID, newMed.MedicineName, newMed.Unit, newMed.Status, newMed.CreatedBy, newMed.CreatedAt
    ]);

    return { success: true, message: 'เพิ่มยาใหม่สำเร็จ', medicine: newMed };
  }

  // 5. Supplies
  public async addSupply(name: string, unit: string, createdBy: string): Promise<{ success: boolean; message: string; supply?: Supply }> {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, message: 'กรุณากรอกชื่อเวชภัณฑ์' };

    const supId = `S${String(this.supplies.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newSup: Supply = {
      SupplyID: supId,
      SupplyName: cleanName,
      Unit: unit.trim() || 'ชิ้น',
      Status: 'ACTIVE',
      CreatedBy: createdBy,
      CreatedAt: now
    };

    this.supplies.push(newSup);
    await this.appendRowToSheet(SHEET_NAMES.SUPPLIES, [
      newSup.SupplyID, newSup.SupplyName, newSup.Unit, newSup.Status, newSup.CreatedBy, newSup.CreatedAt
    ]);

    return { success: true, message: 'เพิ่มเวชภัณฑ์ใหม่สำเร็จ', supply: newSup };
  }

  // 6. Relative Purchases
  public async addRelativePurchase(rp: Omit<RelativePurchase, 'PurchaseID' | 'CreatedAt' | 'Status'>): Promise<{ success: boolean; message: string }> {
    const pid = `RP${String(this.relativePurchases.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newRp: RelativePurchase = {
      ...rp,
      PurchaseID: pid,
      CreatedAt: now,
      Status: 'ACTIVE'
    };

    this.relativePurchases.unshift(newRp);
    await this.appendRowToSheet(SHEET_NAMES.RELATIVE_PURCHASES, [
      newRp.PurchaseID, newRp.PatientID, newRp.HN, newRp.Room, newRp.Bed, newRp.ItemName, newRp.Quantity, newRp.Note, newRp.CreatedBy, newRp.CreatedAt, newRp.Status
    ]);

    return { success: true, message: 'บันทึกรายการญาติซื้อสำเร็จ' };
  }

  public async deleteRelativePurchase(purchaseId: string): Promise<{ success: boolean; message: string }> {
    const idx = this.relativePurchases.findIndex(r => r.PurchaseID === purchaseId);
    if (idx !== -1) {
      this.relativePurchases.splice(idx, 1);
    }
    return { success: true, message: 'ลบรายการญาติซื้อสำเร็จ' };
  }

  // 7. Pending Items
  public async createPendingItems(items: Array<{
    patientId: string;
    hn: string;
    room: any;
    bed: any;
    itemType: 'MEDICINE' | 'SUPPLY';
    itemId: string;
    itemName: string;
    quantity: number;
    requestedBy: string;
  }>): Promise<{ success: boolean; message: string }> {
    if (!items.length) {
      return { success: false, message: 'ไม่มีรายการที่เลือก' };
    }

    const now = new Date().toISOString();
    const newItems: PendingItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      const pid = `PD${String(this.pendingItems.length + i + 1).padStart(5, '0')}`;
      const pendingItem: PendingItem = {
        PendingID: pid,
        PatientID: itm.patientId,
        HN: itm.hn,
        Room: itm.room,
        Bed: itm.bed,
        ItemType: itm.itemType,
        ItemID: itm.itemId,
        ItemName: itm.itemName,
        Quantity: itm.quantity,
        RequestedBy: itm.requestedBy,
        RequestedAt: now,
        Status: 'PENDING'
      };
      newItems.push(pendingItem);
      this.pendingItems.push(pendingItem);

      await this.appendRowToSheet(SHEET_NAMES.PENDING_ITEMS, [
        pendingItem.PendingID,
        pendingItem.PatientID,
        pendingItem.HN,
        pendingItem.Room,
        pendingItem.Bed,
        pendingItem.ItemType,
        pendingItem.ItemID,
        pendingItem.ItemName,
        pendingItem.Quantity,
        pendingItem.RequestedBy,
        pendingItem.RequestedAt,
        pendingItem.Status,
        ''
      ]);
    }

    return {
      success: true,
      message: `บันทึกรายการรอเบิกสำเร็จ (${newItems.length} รายการ)`
    };
  }

  // 8. Confirm Dispense (Combining Pending items into 1 Order + History)
  public async confirmDispense(params: {
    pendingIds: string[];
    confirmedBy: string;
    patientId?: string;
    hn?: string;
    room?: any;
    bed?: any;
  }): Promise<{ success: boolean; message: string; order?: DispenseOrder; items?: DispenseOrderItem[] }> {
    const selected = this.pendingItems.filter(p => params.pendingIds.includes(p.PendingID));

    if (selected.length === 0) {
      return { success: false, message: 'ไม่พบรายการรอเบิกที่เลือก' };
    }

    const first = selected[0];
    const now = new Date().toISOString();
    const orderId = `ORD-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;

    const newOrder: DispenseOrder = {
      OrderID: orderId,
      PatientID: params.patientId || first.PatientID,
      HN: params.hn || first.HN,
      Room: params.room || first.Room,
      Bed: params.bed || first.Bed,
      CreatedBy: first.RequestedBy,
      CreatedAt: first.RequestedAt,
      ConfirmedBy: params.confirmedBy,
      ConfirmedAt: now,
      Status: 'CONFIRMED'
    };

    this.dispenseOrders.unshift(newOrder);
    await this.appendRowToSheet(SHEET_NAMES.DISPENSE_ORDERS, [
      newOrder.OrderID, newOrder.PatientID, newOrder.HN, newOrder.Room, newOrder.Bed,
      newOrder.CreatedBy, newOrder.CreatedAt, newOrder.ConfirmedBy, newOrder.ConfirmedAt, newOrder.Status
    ]);

    const orderItems: DispenseOrderItem[] = [];

    // Create Order Items and History records
    for (let i = 0; i < selected.length; i++) {
      const itm = selected[i];
      const orderItemId = `OI-${String(this.dispenseOrderItems.length + i + 1).padStart(4, '0')}`;
      const histId = `HIS-${String(this.history.length + i + 1).padStart(5, '0')}`;

      const oItem: DispenseOrderItem = {
        OrderItemID: orderItemId,
        OrderID: orderId,
        PendingID: itm.PendingID,
        ItemType: itm.ItemType,
        ItemID: itm.ItemID,
        ItemName: itm.ItemName,
        Quantity: itm.Quantity,
        RequestedBy: itm.RequestedBy,
        RequestedAt: itm.RequestedAt
      };
      orderItems.push(oItem);
      this.dispenseOrderItems.push(oItem);

      await this.appendRowToSheet(SHEET_NAMES.DISPENSE_ORDER_ITEMS, [
        oItem.OrderItemID, oItem.OrderID, oItem.PendingID, oItem.ItemType,
        oItem.ItemID, oItem.ItemName, oItem.Quantity, oItem.RequestedBy, oItem.RequestedAt
      ]);

      const histItem: HistoryItem = {
        HistoryID: histId,
        OrderID: orderId,
        PatientID: itm.PatientID,
        HN: itm.HN,
        Room: itm.Room,
        Bed: itm.Bed,
        ItemType: itm.ItemType,
        ItemName: itm.ItemName,
        Quantity: itm.Quantity,
        RequestedBy: itm.RequestedBy,
        ConfirmedBy: params.confirmedBy,
        CreatedAt: itm.RequestedAt,
        ConfirmedAt: now,
        Status: 'เบิกแล้ว'
      };
      this.history.unshift(histItem);

      await this.appendRowToSheet(SHEET_NAMES.HISTORY, [
        histItem.HistoryID, histItem.OrderID, histItem.PatientID, histItem.HN,
        histItem.Room, histItem.Bed, histItem.ItemType, histItem.ItemName,
        histItem.Quantity, histItem.RequestedBy, histItem.ConfirmedBy,
        histItem.CreatedAt, histItem.ConfirmedAt, histItem.Status
      ]);

      // Mark Pending as COMPLETED
      itm.Status = 'COMPLETED';
    }

    // Remove completed items from active pending list
    this.pendingItems = this.pendingItems.filter(p => p.Status === 'PENDING');

    return {
      success: true,
      message: `ดำเนินการเบิกสำเร็จ รวมทั้งสิ้น ${selected.length} รายการ`,
      order: newOrder,
      items: orderItems
    };
  }

  // 9. Change Password
  public async changePassword(sapUser: string, oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const user = this.users.find(u => u.SAPUser.toLowerCase() === sapUser.toLowerCase());
    if (!user) return { success: false, message: 'ไม่พบผู้ใช้' };
    if (user.Password !== oldPass) return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
    if (newPass.length < 4) return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' };

    user.Password = newPass;

    if (this.spreadsheetId) {
      try {
        const rows = [
          HEADERS.Users,
          ...this.users.map(u => [
            u.UserID, u.SAPUser, u.Password, u.FirstName, u.LastName, u.Position, u.Status, u.Role, u.CreatedAt
          ])
        ];
        await this.fetchGoogleApi(`/${this.spreadsheetId}/values/${encodeURIComponent(SHEET_NAMES.USERS)}!A1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ range: `${SHEET_NAMES.USERS}!A1`, values: rows })
        });
      } catch (err) {
        console.error('Password sync error:', err);
      }
    }

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}

export const db = new GoogleSheetsDatabase();
