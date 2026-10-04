/**
 * EIMC D3 Medical - Google Apps Script Backend API
 * Full Database Operations on Google Sheets
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var action = params.action;
    var result = { success: false, message: 'Invalid action: ' + action };

    var ss = getOrCreateSpreadsheet();

    switch (action) {
      case 'initDatabase':
        result = initDatabaseStructure(ss);
        break;
      case 'login':
        result = handleLogin(ss, params);
        break;
      case 'register':
        result = handleRegister(ss, params);
        break;
      case 'getPatients':
        result = handleGetPatients(ss);
        break;
      case 'getPatient':
        result = handleGetPatient(ss, params.patientId || params.hn);
        break;
      case 'addPatient':
        result = handleAddPatient(ss, params);
        break;
      case 'updatePatient':
        result = handleUpdatePatient(ss, params);
        break;
      case 'deletePatient':
        result = handleDeletePatient(ss, params);
        break;
      case 'getMedicines':
        result = handleGetMedicines(ss);
        break;
      case 'addMedicine':
        result = handleAddMedicine(ss, params);
        break;
      case 'getSupplies':
        result = handleGetSupplies(ss);
        break;
      case 'addSupply':
        result = handleAddSupply(ss, params);
        break;
      case 'getRelativePurchases':
        result = handleGetRelativePurchases(ss, params);
        break;
      case 'addRelativePurchase':
        result = handleAddRelativePurchase(ss, params);
        break;
      case 'getPending':
        result = handleGetPending(ss);
        break;
      case 'getPendingDetail':
        result = handleGetPendingDetail(ss, params);
        break;
      case 'createPending':
        result = handleCreatePending(ss, params);
        break;
      case 'createDispenseOrder':
      case 'confirmDispense':
        result = handleConfirmDispense(ss, params);
        break;
      case 'getHistory':
        result = handleGetHistory(ss);
        break;
      case 'getHistoryDetail':
        result = handleGetHistoryDetail(ss, params.orderId);
        break;
      case 'changePassword':
        result = handleChangePassword(ss, params);
        break;
      case 'getUser':
        result = handleGetUser(ss, params.sapUser || params.userId);
        break;
      default:
        result = { success: false, message: 'Action not supported: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSpreadsheet() {
  var files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);
  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  var newSS = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
  initDatabaseStructure(newSS);
  return newSS;
}

function initDatabaseStructure(ss) {
  var sheets = [
    'Users', 'Patients', 'Medicines', 'Supplies',
    'RelativePurchases', 'PendingItems', 'DispenseOrders',
    'DispenseOrderItems', 'History'
  ];

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    var headers = CONFIG.HEADERS[name];
    if (sheet.getLastRow() === 0 && headers) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }

  // Delete default "Sheet1" if exists
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  return {
    success: true,
    message: 'Database initialized successfully',
    spreadsheetId: ss.getId(),
    url: ss.getUrl()
  };
}

function handleLogin(ss, params) {
  var sapUser = (params.sapUser || '').trim();
  var password = (params.password || '').trim();

  if (!sapUser || !password) {
    return { success: false, message: 'กรุณากรอก SAP User และ Password' };
  }

  var sheet = ss.getSheetByName('Users');
  if (!sheet) return { success: false, message: 'ไม่พบตาราง Users' };

  var data = sheet.getDataRange().getValues();
  // Row 0 is header: UserID, SAPUser, Password, FirstName, LastName, Position, Status, Role, CreatedAt
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[1]).trim().toLowerCase() === sapUser.toLowerCase()) {
      if (String(row[2]) === password) {
        if (row[6] !== 'ACTIVE') {
          return { success: false, message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราว' };
        }
        return {
          success: true,
          message: 'เข้าสู่ระบบสำเร็จ',
          data: {
            userId: row[0],
            sapUser: row[1],
            name: row[3] + ' ' + row[4],
            firstName: row[3],
            lastName: row[4],
            position: row[5],
            status: row[6],
            role: row[7]
          }
        };
      } else {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }
    }
  }

  return { success: false, message: 'ไม่พบผู้ใช้งาน ' + sapUser };
}

function handleRegister(ss, params) {
  var sapUser = (params.sapUser || '').trim();
  var password = (params.password || '').trim();
  var firstName = (params.firstName || '').trim();
  var lastName = (params.lastName || '').trim();
  var position = (params.position || 'พยาบาล').trim();

  if (!sapUser || !password || !firstName || !lastName) {
    return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' };
  }

  var sheet = ss.getSheetByName('Users');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === sapUser.toLowerCase()) {
      return { success: false, message: 'SAP User นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น' };
    }
  }

  var userId = 'U' + ('000' + data.length).slice(-3);
  var now = new Date().toISOString();
  sheet.appendRow([userId, sapUser, password, firstName, lastName, position, 'ACTIVE', 'USER', now]);

  return {
    success: true,
    message: 'ลงทะเบียนสำเร็จ สามารถเข้าสู่ระบบได้ทันที',
    data: { userId: userId, sapUser: sapUser }
  };
}

function handleGetPatients(ss) {
  var sheet = ss.getSheetByName('Patients');
  if (!sheet) return { success: true, data: [] };

  var rows = sheet.getDataRange().getValues();
  var list = [];
  // PatientID, HN, FirstName, LastName, Gender, Room, Bed, Status, CreatedBy, CreatedAt, UpdatedAt
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] || r[1]) {
      list.push({
        PatientID: String(r[0]),
        HN: String(r[1]),
        FirstName: String(r[2]),
        LastName: String(r[3]),
        Gender: String(r[4]),
        Room: String(r[5]),
        Bed: String(r[6]),
        Status: String(r[7]),
        CreatedBy: String(r[8]),
        CreatedAt: String(r[9]),
        UpdatedAt: String(r[10])
      });
    }
  }
  return { success: true, data: list };
}

function handleAddPatient(ss, params) {
  var hn = (params.hn || '').trim();
  var firstName = (params.firstName || '').trim();
  var lastName = (params.lastName || '').trim();
  var gender = params.gender;
  var room = String(params.room || '').trim();
  var bed = String(params.bed || '').trim();
  var status = params.status || 'Admit';
  var createdBy = params.createdBy || 'Unknown';

  if (!hn || !firstName || !lastName || !room || !bed) {
    return { success: false, message: 'ข้อมูลไม่ครบถ้วน (HN, ชื่อ, นามสกุล, ห้อง, เตียง)' };
  }

  var sheet = ss.getSheetByName('Patients');
  var data = sheet.getDataRange().getValues();

  // Check HN uniqueness
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === hn && data[i][7] === 'Admit') {
      return { success: false, message: 'HN ' + hn + ' กำลัง Admit อยู่ในระบบแล้ว' };
    }
    // Check if room and bed is currently occupied by Admit patient
    if (String(data[i][5]).trim() === room && String(data[i][6]).trim() === bed && data[i][7] === 'Admit') {
      return { success: false, message: 'ห้อง ' + room + ' เตียง ' + bed + ' มีผู้ป่วยอยู่แล้ว' };
    }
  }

  var patientId = 'P' + ('0000' + data.length).slice(-4);
  var now = new Date().toISOString();
  sheet.appendRow([patientId, hn, firstName, lastName, gender, room, bed, status, createdBy, now, now]);

  return {
    success: true,
    message: 'บันทึกข้อมูลผู้ป่วยสำเร็จ',
    data: { patientId: patientId, hn: hn }
  };
}

function handleUpdatePatient(ss, params) {
  var patientId = params.patientId;
  var hn = params.hn;
  var sheet = ss.getSheetByName('Patients');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(patientId) || String(data[i][1]) === String(hn)) {
      var rowIdx = i + 1;
      if (params.firstName) sheet.getRange(rowIdx, 3).setValue(params.firstName);
      if (params.lastName) sheet.getRange(rowIdx, 4).setValue(params.lastName);
      if (params.gender) sheet.getRange(rowIdx, 5).setValue(params.gender);
      if (params.room) sheet.getRange(rowIdx, 6).setValue(params.room);
      if (params.bed) sheet.getRange(rowIdx, 7).setValue(params.bed);
      if (params.status) sheet.getRange(rowIdx, 8).setValue(params.status);
      sheet.getRange(rowIdx, 11).setValue(new Date().toISOString());

      return { success: true, message: 'อัปเดตข้อมูลผู้ป่วยสำเร็จ' };
    }
  }

  return { success: false, message: 'ไม่พบผู้ป่วยที่ต้องการแก้ไข' };
}

function handleDeletePatient(ss, params) {
  var patientId = params.patientId;
  var sheet = ss.getSheetByName('Patients');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(patientId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'ลบข้อมูลผู้ป่วยสำเร็จ' };
    }
  }
  return { success: false, message: 'ไม่พบผู้ป่วย' };
}

function handleGetMedicines(ss) {
  var sheet = ss.getSheetByName('Medicines');
  if (!sheet) return { success: true, data: [] };
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] || r[1]) {
      list.push({
        MedicineID: String(r[0]),
        MedicineName: String(r[1]),
        Unit: String(r[2]),
        Status: String(r[3]),
        CreatedBy: String(r[4]),
        CreatedAt: String(r[5])
      });
    }
  }
  return { success: true, data: list };
}

function handleAddMedicine(ss, params) {
  var name = (params.medicineName || '').trim();
  var unit = (params.unit || 'เม็ด').trim();
  var createdBy = params.createdBy || 'User';

  if (!name) return { success: false, message: 'กรุณากรอกชื่อยา' };

  var sheet = ss.getSheetByName('Medicines');
  var data = sheet.getDataRange().getValues();
  var medId = 'M' + ('000' + data.length).slice(-3);
  var now = new Date().toISOString();
  sheet.appendRow([medId, name, unit, 'ACTIVE', createdBy, now]);

  return {
    success: true,
    message: 'เพิ่มยาใหม่สำเร็จ',
    data: { MedicineID: medId, MedicineName: name, Unit: unit, Status: 'ACTIVE' }
  };
}

function handleGetSupplies(ss) {
  var sheet = ss.getSheetByName('Supplies');
  if (!sheet) return { success: true, data: [] };
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] || r[1]) {
      list.push({
        SupplyID: String(r[0]),
        SupplyName: String(r[1]),
        Unit: String(r[2]),
        Status: String(r[3]),
        CreatedBy: String(r[4]),
        CreatedAt: String(r[5])
      });
    }
  }
  return { success: true, data: list };
}

function handleAddSupply(ss, params) {
  var name = (params.supplyName || '').trim();
  var unit = (params.unit || 'ชิ้น').trim();
  var createdBy = params.createdBy || 'User';

  if (!name) return { success: false, message: 'กรุณากรอกชื่อเวชภัณฑ์' };

  var sheet = ss.getSheetByName('Supplies');
  var data = sheet.getDataRange().getValues();
  var supId = 'S' + ('000' + data.length).slice(-3);
  var now = new Date().toISOString();
  sheet.appendRow([supId, name, unit, 'ACTIVE', createdBy, now]);

  return {
    success: true,
    message: 'เพิ่มเวชภัณฑ์ใหม่สำเร็จ',
    data: { SupplyID: supId, SupplyName: name, Unit: unit, Status: 'ACTIVE' }
  };
}

function handleGetRelativePurchases(ss, params) {
  var sheet = ss.getSheetByName('RelativePurchases');
  if (!sheet) return { success: true, data: [] };
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0]) {
      list.push({
        PurchaseID: String(r[0]),
        PatientID: String(r[1]),
        HN: String(r[2]),
        Room: String(r[3]),
        Bed: String(r[4]),
        ItemName: String(r[5]),
        Quantity: Number(r[6]),
        Note: String(r[7]),
        CreatedBy: String(r[8]),
        CreatedAt: String(r[9]),
        Status: String(r[10])
      });
    }
  }
  return { success: true, data: list };
}

function handleAddRelativePurchase(ss, params) {
  var patientId = params.patientId;
  var hn = params.hn;
  var room = params.room;
  var bed = params.bed;
  var itemName = (params.itemName || '').trim();
  var quantity = Number(params.quantity) || 1;
  var note = params.note || '';
  var createdBy = params.createdBy || 'User';

  if (!itemName || !hn) return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };

  var sheet = ss.getSheetByName('RelativePurchases');
  var data = sheet.getDataRange().getValues();
  var pid = 'RP' + ('000' + data.length).slice(-3);
  var now = new Date().toISOString();
  sheet.appendRow([pid, patientId, hn, room, bed, itemName, quantity, note, createdBy, now, 'ACTIVE']);

  return { success: true, message: 'บันทึกรายการญาติซื้อสำเร็จ' };
}

function handleGetPending(ss) {
  var sheet = ss.getSheetByName('PendingItems');
  if (!sheet) return { success: true, data: [] };
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] && String(r[11]) === 'PENDING') {
      list.push({
        PendingID: String(r[0]),
        PatientID: String(r[1]),
        HN: String(r[2]),
        Room: String(r[3]),
        Bed: String(r[4]),
        ItemType: String(r[5]),
        ItemID: String(r[6]),
        ItemName: String(r[7]),
        Quantity: Number(r[8]),
        RequestedBy: String(r[9]),
        RequestedAt: String(r[10]),
        Status: String(r[11]),
        GroupID: String(r[12] || '')
      });
    }
  }

  // Sort by Room numerically
  list.sort(function(a, b) {
    var rA = parseInt(a.Room, 10) || 0;
    var rB = parseInt(b.Room, 10) || 0;
    if (rA !== rB) return rA - rB;
    return (a.Bed || '').localeCompare(b.Bed || '');
  });

  return { success: true, data: list };
}

function handleCreatePending(ss, params) {
  var items = params.items || [];
  if (!items.length) return { success: false, message: 'ไม่มีรายการที่เลือก' };

  var sheet = ss.getSheetByName('PendingItems');
  var lastRow = sheet.getLastRow();
  var now = new Date().toISOString();
  var createdCount = 0;

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var pid = 'PD' + ('00000' + (lastRow + i)).slice(-5);
    sheet.appendRow([
      pid,
      item.patientId,
      item.hn,
      item.room,
      item.bed,
      item.itemType, // MEDICINE or SUPPLY
      item.itemId,
      item.itemName,
      item.quantity,
      item.requestedBy,
      item.requestedAt || now,
      'PENDING',
      item.groupId || ''
    ]);
    createdCount++;
  }

  return {
    success: true,
    message: 'ส่งรายการรอเบิกสำเร็จ (' + createdCount + ' รายการ)'
  };
}

function handleConfirmDispense(ss, params) {
  var pendingIds = params.pendingIds || [];
  var confirmedBy = params.confirmedBy || 'Nurse';
  var patientId = params.patientId;
  var hn = params.hn;
  var room = params.room;
  var bed = params.bed;

  var pendingSheet = ss.getSheetByName('PendingItems');
  var ordersSheet = ss.getSheetByName('DispenseOrders');
  var orderItemsSheet = ss.getSheetByName('DispenseOrderItems');
  var historySheet = ss.getSheetByName('History');

  var pendingData = pendingSheet.getDataRange().getValues();
  var matchedItems = [];

  for (var i = 1; i < pendingData.length; i++) {
    var pId = String(pendingData[i][0]);
    if (pendingIds.indexOf(pId) !== -1) {
      matchedItems.push({
        rowIndex: i + 1,
        pendingId: pId,
        patientId: pendingData[i][1],
        hn: pendingData[i][2],
        room: pendingData[i][3],
        bed: pendingData[i][4],
        itemType: pendingData[i][5],
        itemId: pendingData[i][6],
        itemName: pendingData[i][7],
        quantity: pendingData[i][8],
        requestedBy: pendingData[i][9],
        requestedAt: pendingData[i][10]
      });
    }
  }

  if (matchedItems.length === 0) {
    return { success: false, message: 'ไม่พบรายการรอเบิกที่เลือก' };
  }

  var now = new Date().toISOString();
  var orderId = 'ORD-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd-HHmmss');

  // 1. Create DispenseOrder
  ordersSheet.appendRow([
    orderId,
    patientId || matchedItems[0].patientId,
    hn || matchedItems[0].hn,
    room || matchedItems[0].room,
    bed || matchedItems[0].bed,
    matchedItems[0].requestedBy,
    now,
    confirmedBy,
    now,
    'CONFIRMED'
  ]);

  // 2. Create OrderItems, History, and update PendingItems status
  for (var j = 0; j < matchedItems.length; j++) {
    var itm = matchedItems[j];
    var orderItemId = 'OI-' + ('0000' + (orderItemsSheet.getLastRow() + j)).slice(-4);
    var histId = 'HIS-' + ('00000' + (historySheet.getLastRow() + j)).slice(-5);

    orderItemsSheet.appendRow([
      orderItemId,
      orderId,
      itm.pendingId,
      itm.itemType,
      itm.itemId,
      itm.itemName,
      itm.quantity,
      itm.requestedBy,
      itm.requestedAt
    ]);

    historySheet.appendRow([
      histId,
      orderId,
      itm.patientId,
      itm.hn,
      itm.room,
      itm.bed,
      itm.itemType,
      itm.itemName,
      itm.quantity,
      itm.requestedBy,
      confirmedBy,
      itm.requestedAt,
      now,
      'เบิกแล้ว'
    ]);

    // Update Pending status to COMPLETED
    pendingSheet.getRange(itm.rowIndex, 12).setValue('COMPLETED');
  }

  return {
    success: true,
    message: 'ยืนยันการเบิกและสร้างใบเบิกเรียบร้อยแล้ว',
    data: {
      orderId: orderId,
      confirmedAt: now,
      confirmedBy: confirmedBy,
      itemCount: matchedItems.length
    }
  };
}

function handleGetHistory(ss) {
  var sheet = ss.getSheetByName('History');
  if (!sheet) return { success: true, data: [] };
  var rows = sheet.getDataRange().getValues();
  var list = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[0]) {
      list.push({
        HistoryID: String(r[0]),
        OrderID: String(r[1]),
        PatientID: String(r[2]),
        HN: String(r[3]),
        Room: String(r[4]),
        Bed: String(r[5]),
        ItemType: String(r[6]),
        ItemName: String(r[7]),
        Quantity: Number(r[8]),
        RequestedBy: String(r[9]),
        ConfirmedBy: String(r[10]),
        CreatedAt: String(r[11]),
        ConfirmedAt: String(r[12]),
        Status: String(r[13])
      });
    }
  }
  // Sort descending by confirmed time
  list.sort(function(a, b) {
    return new Date(b.ConfirmedAt).getTime() - new Date(a.ConfirmedAt).getTime();
  });
  return { success: true, data: list };
}

function handleChangePassword(ss, params) {
  var sapUser = (params.sapUser || '').trim();
  var oldPassword = params.oldPassword;
  var newPassword = params.newPassword;

  if (!sapUser || !oldPassword || !newPassword) {
    return { success: false, message: 'ข้อมูลไม่ครบถ้วน' };
  }

  var sheet = ss.getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === sapUser.toLowerCase()) {
      if (String(data[i][2]) === oldPassword) {
        sheet.getRange(i + 1, 3).setValue(newPassword);
        return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
      } else {
        return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
      }
    }
  }
  return { success: false, message: 'ไม่พบผู้ใช้' };
}
