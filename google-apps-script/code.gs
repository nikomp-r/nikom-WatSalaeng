// --------------------------------------------------------------------------------------
// หรือคัดลอกไฟล์นี้ไปวางในระบบ Google Apps Script (ในเมนู ส่วนขยาย -> Apps Script ของ Google Sheets)
// พอร์ทัลระบบลงทะเบียนผู้เยี่ยมชม โรงเรียนวัดแสลง (เขมราษฎร์วิทยาคาร) จันทบุรี
// --------------------------------------------------------------------------------------

// 1. ระบุ ID ของไฟล์ Google Sheets (หากปล่อยว่างไว้ ระบบจะเชื่อมกับ Sheets ที่เปิดสคริปต์อยู่โดยอัตโนมัติ)
const SPREADSHEET_ID = "1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA"; 
const SHEET_NAME = "รายชื่อผู้เยี่ยมชม";

/**
 * ฟังค์ชันสำหรับรับข้อมูลแบบ POST จากนอกระบบ (เช่น จากหน้าเว็บหลักผ่าน Web App Call)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // หากไม่มีแผ่นงาน (Sheet) ชื่อนี้ ให้ทำการสร้างพร้อมเขียนส่วนหัวของตารางข้อมูล (Header)
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["ID", "ชื่อ", "นามสกุล", "หน่วยงานสังกัด/สถานภาพ", "Timestamp", "วันที่ลงทะเบียน"]);
      
      // ตกแต่งส่วนหัวตารางข้อมูลใน Google Sheets ให้ดูสวยงามเป็นทางการ
      sheet.getRange("A1:F1").setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
    }
    
    const id = postData.id || "v-" + new Date().getTime();
    const firstName = postData.firstName || "";
    const lastName = postData.lastName || "";
    const organization = postData.organization || "";
    const timestamp = postData.timestamp || new Date().getTime();
    const dateString = postData.dateString || new Date().toISOString().split('T')[0];
    
    // นำเข้าข้อมูลผู้เยี่ยมชมแถวใหม่ไปยังแถวถัดไปของตารางแบบเรียลไทม์
    sheet.appendRow([id, firstName, lastName, organization, timestamp.toString(), dateString]);
    
    // ส่งข้อความความสำเร็จกลับ และรองรับแนวนโยบายข้ามเครื่องมือ (CORS)
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "บันทึกข้อมูลและประมวลส่งไปยัง Google Sheets เรียบร้อยแล้วค่ะ",
      data: { id, firstName, lastName, organization, timestamp, dateString }
    }))
    .setMimeType(ContentService.MimeType.JSON); 
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "เกิดข้อผิดพลาดในการประมวลผล: " + error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังค์ชันดึงข้อมูลผู้เข้าศึกษาดูงาน (GET Method) หรือสำหรับรันหน้าเว็บอิสระ HTML แบบเต็มจอ
 */
function doGet(e) {
  // หากต้องการดึงข้อมูล JSON ให้แนบพารามิเตอร์ ?action=data
  if (e.parameter && e.parameter.action === 'data') {
    try {
      const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const rows = sheet.getDataRange().getValues();
      const data = [];
      
      // ดึงค่าข้อมูลที่มีทั้งหมดแบบวนซ้ำ (ข้ามแถวหัวข้อ index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        data.push({
          id: row[0],
          firstName: row[1],
          lastName: row[2],
          organization: row[3],
          timestamp: row[4],
          dateString: row[5]
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: data.length,
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // โดยค่าเริ่มต้นเมื่อคลิกเปิดลิงก์ Web App (Homepage) จะนำส่งหน้าจอลงทะเบียนรูปโฉมพรีเมียมสีเขียวสะอ้านทันที
  try {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle("ระบบลงทะเบียนเข้าเรียนรู้ - โรงเรียนวัดแสลง")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    // กรณีที่ผู้ใช้งานยังไม่ได้เพิ่มไฟล์ Index หรือพิมพ์ชื่อเป็นตัวเล็ก (index) ให้ตอบสนองด้วยหน้านำแนะนำอย่างเป็นมิตรแทนที่จะล้มเหลว
    return HtmlService.createHtmlOutput(
      "<!DOCTYPE html>" +
      "<html>" +
      "<head><meta charset='utf-8'><title>แจ้งเตือนความคืบหน้าการติดตั้ง</title></head>" +
      "<body style='font-family: \"ChulaCharasNew\", \"Sarabun\", sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; text-align: center;'>" +
      "  <div style='max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;'>" +
      "    <div style='font-size: 50px; margin-bottom: 20px;'>💡</div>" +
      "    <h2 style='color: #0f172a; margin-bottom: 12px; font-weight: 800;'>ต้องสร้างไฟล์แผ่นงานภาพ \"Index\" เพิ่มเติมค่ะ</h2>" +
      "    <p style='color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;'>" +
      "      สาเหตุเนื่องจาก Google Apps Script ยังไม่พบไฟล์ HTML ชื่อ <strong style='color: #ea580c; background-color: #fff7ed; padding: 2px 6px; border-radius: 6px;'>Index</strong> (ตัวสะกด <strong>I ตัวใหญ่</strong> เท่านั้น)<br/>" +
      "      ส่งผลให้ระบบดึงหน้าตากล่องลงทะเบียนดีไซน์สวยงามสีเขียวมาเล่นไม่ได้ชั่วคราว" +
      "    </p>" +
      "    <div style='text-align: left; background-color: #f1f5f9; padding: 20px; border-radius: 16px; font-size: 13px; line-height: 1.7;'>" +
      "      <p style='margin-top: 0; font-weight: bold; color: #334155;'>🛠️ วิธีแก้ไขง่ายๆ ใน 1 นาที:</p>" +
      "      <ol style='margin-bottom: 0; padding-left: 20px; color: #475569;'>" +
      "        <li style='margin-bottom: 6px;'>ในหน้าเว็บสคริปต์ Google Apps Script (ที่รันโค้ดนี้อยู่) ให้มองแถบเมนูด้านซ้าย</li>" +
      "        <li style='margin-bottom: 6px;'>คลิกปุ่มปุ่ม <strong>เครื่องหมายบวกรุ่นบวก (+)</strong> ถัดจากหัวข้อ <strong>\"ไฟล์\" (Files)</strong></li>" +
      "        <li style='margin-bottom: 6px;'>เลือกเมนู <strong>HTML</strong></li>" +
      "        <li style='margin-bottom: 6px;'>พิมพ์คำว่า <strong style='color: #0f172a;'>Index</strong> (ใช้ตัวอักษร <strong>I ตัวใหญ่</strong> สะกด) แล้วกดปุ่ม Enter</li>" +
      "        <li style='margin-bottom: 6px;'>คัดลอกโค้ดจากแท็บ <strong>\"Index.html\"</strong> ในหน้าแอปพลิเคชันส่วนตั้งค่า (Settings) ไปวางทับทั้งหมดแทนที่โค้ดเดิม และกดบันทึก</li>" +
      "        <li>คลิกเลือกปุ่ม <strong>การทำให้ใช้งานได้ภายนอก (Deploy) > จัดการการทำให้ใช้งานได้ (Manage Deployments)</strong> แล้วอัปเดตเวอร์ชันใหม่สู่คลาวด์ค่ะ</li>" +
      "      </ol>" +
      "    </div>" +
      "    <p style='margin-top: 24px; font-size: 11px; color: #94a3b8;'>ด้วยความปรารถนาดีจาก ระบบพอร์ทัลลงทะเบียนศึกษาดูงาน โรงเรียนวัดแสลง</p>" +
      "  </div>" +
      "</body>" +
      "</html>"
    )
    .setTitle("คำแนะนำการตั้งค่า - โรงเรียนวัดแสลง")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}
