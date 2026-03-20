// ============================================================
// GOOGLE APPS SCRIPT — Lead Tracker for Second Nature Tree
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to sheets.google.com and create a new spreadsheet
// 2. Name it "Second Nature Lead Tracker"
// 3. In Row 1, add these headers:
//    A: Timestamp | B: Source | C: Medium | D: Campaign | E: Page | F: Referrer | G: Device | H: City
// 4. Go to Extensions > Apps Script
// 5. Delete any default code and paste THIS ENTIRE FILE
// 6. Click Deploy > New deployment
// 7. Type: Web app
// 8. Execute as: Me
// 9. Who has access: Anyone
// 10. Click Deploy and copy the URL
// 11. Paste that URL into the TRACKER_URL variable in main.js on your site
// ============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('en-US', {timeZone: 'America/New_York'}),
      data.source || 'direct',
      data.medium || '',
      data.campaign || '',
      data.page || '',
      data.referrer || '',
      data.device || '',
      data.city || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Monthly report endpoint
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Get current month's data
  var now = new Date();
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var results = [];
  var sourceCounts = {};

  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    if (rowDate >= monthStart) {
      var source = data[i][1] || 'direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      results.push({
        timestamp: data[i][0],
        source: source,
        medium: data[i][2],
        campaign: data[i][3],
        page: data[i][4]
      });
    }
  }

  var output = {
    month: now.toLocaleString('en-US', {month: 'long', year: 'numeric'}),
    totalLeads: results.length,
    bySource: sourceCounts,
    details: results
  };

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
