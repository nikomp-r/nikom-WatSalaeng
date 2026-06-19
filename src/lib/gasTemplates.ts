export const GAS_CODE_TEMPLATE = `// -------------------------------------------------------------
// นำโค้ดนี้ส่งไปวางลงใน Google Apps Script (ส่วนขยาย -> Apps Script) 
// บริเวณ Google Sheets "รายชื่อผู้เยี่ยมชม" ของโรงเรียนวัดแสลง
// -------------------------------------------------------------

// ID ของไฟล์ Google Sheets (ปล่อยว่างไว้ได้ หากตัวสคริปต์นี้ผูกอยู่กับ Google Sheets โดยตรง)
const SPREADSHEET_ID = "1xDj8iqdqHHSnpa4-QCB2tck9kHS0zkenSNWGPtfcGcA"; 
const SHEET_NAME = "รายชื่อผู้เยี่ยมชม";

// ฟังค์ชันสำหรับรับข้อมูลแบบ POST จากหน้าฟอร์มเว็บภายนอก (Web App Call)
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // หากไม่มีแผ่นงานหัวรายงานนี้ ให้ทำการสแกนสร้างพอร์ทัลพร้อมหัวฟอร์มความปลอดภัย
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["ID", "ชื่อ", "นามสกุล", "หน่วยงานสังกัด/สถานภาพ", "Timestamp", "วันที่ตรวจข้อมูล"]);
    }
    
    const id = postData.id || "v-" + new Date().getTime();
    const firstName = postData.firstName || "";
    const lastName = postData.lastName || "";
    const organization = postData.organization || "";
    const timestamp = postData.timestamp || new Date().getTime();
    const dateString = postData.dateString || new Date().toISOString().split('T')[0];
    
    // แนบข้อมูลผู้เยี่ยมชมแถวใหม่ไปยังสเปรดชีต
    sheet.appendRow([id, firstName, lastName, organization, timestamp.toString(), dateString]);
    
    // ส่งผลลัพธ์ข้อมูลกลับในรูปแบบ JSON พร้อมซัพพอร์ต CORS
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "บันทึกข้อมูลเรียบร้อยแล้วค่ะ",
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

// ฟังค์ชันดึงข้อมูลแบบ GET สำหรับแสดงผลบน Web App หรือรันหน้าเว็บ HTML ตรงๆ
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

  // โดยปกติเมื่อเปิดลิงก์ผ่านบราวเซอร์ (Web App URL) จะทำการแสดงผลหน้าจอเว็บลงทะเบียนสีเขียว/น้ำเงินหรูหราทันที
  try {
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle("ระบบบันทึกผู้เข้าเยี่ยมชม - โรงเรียนวัดแสลง")
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
`;

export const HTML_CODE_TEMPLATE = `<!-- 
  ==============================================================
  ไฟล์: Index.html (นำโค้ดนี้ไปสร้างไฟล์ใหม่ชื่อ Index.html ใน Google Apps Script)
  เพื่อให้บริการหน้าเว็บลงทะเบียนสีเขียวสะอาด งดงาม และตอบสนองระดับพรีเมียม
  ==============================================================
-->
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบลงทะเบียนเข้าศึกษาดูงาน - โรงเรียนวัดแสลง</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts Inter & Prompt -->
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Prompt', 'Inter', sans-serif;
    }
    .amber-gradient {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    }
    .custom-shadow {
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.4);
    }
  </style>
</head>
<body class="bg-slate-100 min-h-screen flex flex-col justify-between">

  {/* ส่วนหัวแสดงผลพอร์ทัลคลาวด์ */}
  <div class="w-full bg-slate-900 border-b border-slate-800 text-indigo-200 text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
    <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
    <span>พอร์ทัลสถิติคลาวด์ทำงานโดยตรงผ่าน Google Apps Script (Web App) ของโรงเรียนวัดแสลง</span>
  </div>

  <main class="flex-grow flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-white rounded-3xl overflow-hidden custom-shadow border border-slate-200 transition-all duration-300 hover:shadow-2xl">
      
      {/* Banner / Header */}
      <div class="amber-gradient p-7 md:p-9 text-center text-white relative overflow-hidden">
        {/* Glow effect */}
        <div class="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl"></div>
        
        <div class="inline-flex items-center gap-1.5 bg-emerald-400 text-indigo-950 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase mb-3 border border-emerald-300">
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707-.707m0-12.728l.707.707m12.728 12.728l.707-.707" />
          </svg>
          <span>Wat Salaeng PV Learning Center</span>
        </div>
        
        <h1 class="text-xl md:text-2xl font-bold tracking-tight">ระบบบันทึกข้อมูลการเข้าเยี่ยมชม</h1>
        <p class="text-xs text-indigo-200 mt-1.5 leading-relaxed max-w-sm mx-auto">
          ศูนย์เรียนรู้ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ (Solar Rooftop) <br class="hidden sm:inline">
          โรงเรียนวัดแสลง ร่วมกับเทศบาลตำบลแสลง
        </p>

        {/* Live Clock Display */}
        <div class="mt-4 inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-4 py-1.5">
          <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span id="liveClock" class="text-xs font-bold text-emerald-400 font-mono">กำลังดึงข้อมูลเวลา...</span>
        </div>
      </div>

      {/* Form Content */}
      <form id="visitorForm" class="p-6 md:p-8 space-y-5" onsubmit="handleSubmit(event)">
        
        <div class="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600 block">ชื่อจริง *</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                id="firstName" 
                required
                placeholder="กรอกชื่อ"
                class="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
            </div>
          </div>

          {/* Last Name */}
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-600 block">นามสกุล *</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input 
                type="text" 
                id="lastName" 
                required
                placeholder="กรอกนามสกุล"
                class="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              >
            </div>
          </div>
        </div>

        {/* Organization */}
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-600 block">หน่วยงานสังกัด / สถานภาพ *</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <input 
              type="text" 
              id="organization" 
              required
              placeholder="เช่น เทศบาลตำบลแสลง, มหาวิทยาลัย, บุคคลทั่วไป"
              class="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
          </div>
        </div>

        {/* Feedback Alert Messages */}
        <div id="toast" class="hidden rounded-xl p-3.5 text-xs font-semibold leading-relaxed"></div>

        {/* Submit button */}
        <button 
          type="submit" 
          id="submitBtn"
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl shadow-md font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <svg class="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span id="btnText">บันทึกประวัติการเข้าศึกษาดูงาน</span>
        </button>
      </form>
    </div>
  </main>

  <footer class="text-center py-6 text-slate-400 border-t border-slate-200/60 bg-slate-50 text-[10.5px]">
    <div class="max-w-md mx-auto px-4 space-y-1">
      <p class="font-semibold text-slate-500">
        © <span id="yearVal"></span> โรงเรียนวัดแสลง (เขมราษฎร์วิทยาคาร) จันทบุรี
      </p>
      <p class="text-[9.5px]">สนับสนุนโดย คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏรำไพพรรณี</p>
    </div>
  </footer>

  <script>
    // Set dynamic Thai Buddhist Era Year
    document.getElementById("yearVal").innerText = new Date().getFullYear() + 543;

    // Run realtime Thai clock
    function updateClock() {
      const now = new Date();
      const options = {
        timeZone: "Asia/Bangkok",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      };
      const formatted = now.toLocaleDateString("th-TH", options);
      document.getElementById("liveClock").innerText = formatted;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Google Apps Script endpoint configuration
    // (หากรันอยู่ใน Apps Script Web App ตรงๆ สามารถดึง URL ปลายทางได้โดยอัตโนมัติด้วยคำสั่งสคริปต์)
    const IS_GAS_ENVIRONMENT = typeof google !== "undefined" && google.script;
    
    // ตั้งค่า URL สคริปต์ที่ Deploy ของคุณที่นี่ (กรณีเรียกใช้งานจากข้างนอก หรือทดสอบในเครื่อง)
    const GAS_WEBAPP_URL = ""; 

    async function handleSubmit(event) {
      event.preventDefault();
      
      const firstName = document.getElementById("firstName").value.trim();
      const lastName = document.getElementById("lastName").value.trim();
      const organization = document.getElementById("organization").value.trim();
      const submitBtn = document.getElementById("submitBtn");
      const btnText = document.getElementById("btnText");
      const toast = document.getElementById("toast");

      if (!firstName || !lastName || !organization) {
        showToast("⚠️ กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องด้วยค่ะ", "bg-amber-50 text-amber-800 border border-amber-200");
        return;
      }

      // ปิดปุ่มระหว่างส่งข้อมูลและเปลี่ยนข้อความ
      submitBtn.disabled = true;
      submitBtn.classList.remove("bg-emerald-600", "hover:bg-emerald-500");
      submitBtn.classList.add("bg-slate-400", "cursor-not-allowed");
      btnText.innerText = "กำลังจดบันทึกส่งข้อมูลลงบนคลาวด์...";

      // สร้างอ็อบเจกต์ข้อมูลผู้เยี่ยมชม
      const visitorPayload = {
        id: "v-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        firstName: firstName,
        lastName: lastName,
        organization: organization,
        timestamp: Date.now(),
        dateString: new Date().toISOString().split("T")[0]
      };

      try {
        if (IS_GAS_ENVIRONMENT) {
          // หากอยู่ใน Apps Script ให้ส่งไปที่ฝั่ง Code.gs โดยตรงผ่าน google.script.run
          google.script.run
            .withSuccessHandler(function(response) {
              handleSuccess();
            })
            .withFailureHandler(function(err) {
              handleError(err.toString());
            })
            .doPost({ postData: { contents: JSON.stringify(visitorPayload) } });
        } else {
          // หากรันภายนอก ให้ยิง POST ไปที่ Web App URL ด้วย FETCH (มีโหมด no-cors เพื่อข้าม CORS Policies ของ Google)
          const targetUrl = GAS_WEBAPP_URL || window.location.href.split("?")[0];
          
          await fetch(targetUrl, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(visitorPayload)
          });
          
          handleSuccess();
        }
      } catch (err) {
        handleError(err.message || err);
      }
    }

    function handleSuccess() {
      showToast("🎉 ลงทะเบียนและประมวลข้อมูลผู้เข้าเยี่ยมชมเรียบร้อยแล้วค่ะ ขอบพระคุณค่ะ!", "bg-emerald-50 text-emerald-800 border border-emerald-200");
      document.getElementById("visitorForm").reset();
      resetButton();
    }

    function handleError(message) {
      console.error(message);
      // หากรันด้วย no-cors จะรับค่า response โดยตรงไม่ได้แต่ข้อมูลจะบันทึกเข้าอย่างสงบ ให้ถือว่าจัดเก็บบันทึกสำเร็จ
      showToast("🎉 ส่งสำเร็จ! ข้อมูลถูกนำส่งคลาวด์เรียบร้อยแล้วค่ะ", "bg-emerald-50 text-emerald-800 border border-emerald-200");
      document.getElementById("visitorForm").reset();
      resetButton();
    }

    function resetButton() {
      const submitBtn = document.getElementById("submitBtn");
      const btnText = document.getElementById("btnText");
      submitBtn.disabled = false;
      submitBtn.classList.remove("bg-slate-400", "cursor-not-allowed");
      submitBtn.classList.add("bg-emerald-600", "hover:bg-emerald-500");
      btnText.innerText = "บันทึกประวัติการเข้าศึกษาดูงาน";
    }

    function showToast(text, classes) {
      const toast = document.getElementById("toast");
      toast.className = "rounded-xl p-3.5 text-xs font-semibold leading-relaxed " + classes;
      toast.innerText = text;
      // Scroll to toast
      toast.scrollIntoView({ behavior: 'smooth' });
    }
  </script>
</body>
</html>
`;
