/**
 * NEXA EXAM - Serverless Email Engine
 * 
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Click "New Project" and paste this code.
 * 3. Click "Deploy" -> "New Deployment".
 * 4. Select Type: "Web App".
 * 5. Execute as: "Me" (your account).
 * 6. Who has access: "Anyone" (so the dashboard can talk to it).
 * 7. Copy the "Web App URL" and paste it into student.js/admin.js/manager.js
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to;
    var subject = data.subject;
    var body = data.body;
    
    var options = {
      name: "NEXA EXAM System",
      htmlBody: body.replace(/\n/g, '<br>')
    };

    // Handle PDF Attachment (Base64)
    if (data.attachment && data.attachment.content) {
      var fileName = data.attachment.filename || "Report.pdf";
      var pdfBlob = Utilities.newBlob(Utilities.base64Decode(data.attachment.content), 'application/pdf', fileName);
      options.attachments = [pdfBlob];
    }

    MailApp.sendEmail(to, subject, body, options);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, msg: "Real email sent successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Test function to verify permissions
function testEmail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "NEXA Test", "If you see this, permissions are granted!");
}
