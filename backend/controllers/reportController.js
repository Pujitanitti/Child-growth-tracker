const PDFDocument = require('pdfkit');
const { Parser: CsvParser } = require('json2csv');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const Vaccination = require('../models/Vaccination');
const { findOwnedChild } = require('./childController');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAction } = require('../middleware/auditLogger');

function startPdf(res, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  return doc;
}

function drawHeader(doc, title, child) {
  doc.fontSize(20).fillColor('#4F46E5').text('Child Growth Tracker', { align: 'left' });
  doc.moveDown(0.2);
  doc.fontSize(14).fillColor('#111').text(title);
  doc.fontSize(10).fillColor('#555').text(`Child: ${child.name}  |  DOB: ${new Date(child.dateOfBirth).toDateString()}  |  Generated: ${new Date().toDateString()}`);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e0e0e0').stroke();
  doc.moveDown();
}

// GET /api/children/:childId/reports/growth (PDF)
const growthReport = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);
  const records = await GrowthRecord.find({ child: child._id }).sort({ date: 1 });

  const doc = startPdf(res, `${child.name}-growth-report.pdf`);
  drawHeader(doc, 'Growth Report', child);

  doc.fontSize(11).fillColor('#111');
  records.forEach((r) => {
    doc.text(
      `${new Date(r.date).toLocaleDateString()}   Height: ${r.heightCm}cm   Weight: ${r.weightKg}kg   BMI: ${r.bmi ?? '-'}   Percentile: ${r.percentile ?? '-'}`
    );
  });
  if (records.length === 0) doc.fontSize(11).fillColor('#777').text('No growth records yet.');

  await logAction(req, 'REPORT_DOWNLOADED', 'Child', child._id, { type: 'growth-pdf' });
  doc.end();
});

// GET /api/children/:childId/reports/vaccination (PDF)
const vaccinationReport = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);
  const vaccinations = await Vaccination.find({ child: child._id }).sort({ dueDate: 1 });

  const doc = startPdf(res, `${child.name}-vaccination-report.pdf`);
  drawHeader(doc, 'Vaccination Report', child);

  doc.fontSize(11).fillColor('#111');
  vaccinations.forEach((v) => {
    doc.text(`${v.vaccine} (${v.doseLabel || '-'})   Due: ${new Date(v.dueDate).toLocaleDateString()}   Status: ${v.status}`);
  });
  if (vaccinations.length === 0) doc.fontSize(11).fillColor('#777').text('No vaccination records yet.');

  await logAction(req, 'REPORT_DOWNLOADED', 'Child', child._id, { type: 'vaccination-pdf' });
  doc.end();
});

// GET /api/children/:childId/reports/summary (PDF) — child profile + latest stats
const summaryReport = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);
  const latest = await GrowthRecord.findOne({ child: child._id }).sort({ date: -1 });
  const upcomingVaccines = await Vaccination.find({ child: child._id, status: 'upcoming' }).sort({ dueDate: 1 }).limit(5);

  const doc = startPdf(res, `${child.name}-summary-report.pdf`);
  drawHeader(doc, 'Child Summary Report', child);

  doc.fontSize(12).fillColor('#111').text('Profile');
  doc.fontSize(10).fillColor('#333')
    .text(`Gender: ${child.gender}`)
    .text(`Blood Group: ${child.bloodGroup}`)
    .text(`Allergies: ${(child.allergies || []).join(', ') || 'None recorded'}`)
    .text(`Medical Conditions: ${(child.medicalConditions || []).join(', ') || 'None recorded'}`);

  doc.moveDown();
  doc.fontSize(12).fillColor('#111').text('Latest Growth');
  doc.fontSize(10).fillColor('#333').text(
    latest
      ? `Height: ${latest.heightCm}cm | Weight: ${latest.weightKg}kg | BMI: ${latest.bmi} | Recorded: ${new Date(latest.date).toDateString()}`
      : 'No growth records yet.'
  );

  doc.moveDown();
  doc.fontSize(12).fillColor('#111').text('Upcoming Vaccinations');
  if (upcomingVaccines.length === 0) doc.fontSize(10).fillColor('#333').text('None scheduled.');
  upcomingVaccines.forEach((v) => {
    doc.fontSize(10).fillColor('#333').text(`${v.vaccine} — Due ${new Date(v.dueDate).toDateString()}`);
  });

  await logAction(req, 'REPORT_DOWNLOADED', 'Child', child._id, { type: 'summary-pdf' });
  doc.end();
});

// GET /api/children/:childId/reports/growth.csv
const growthCsv = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);
  const records = await GrowthRecord.find({ child: child._id }).sort({ date: 1 }).lean();

  const rows = records.map((r) => ({
    date: new Date(r.date).toISOString().slice(0, 10),
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    headCircumferenceCm: r.headCircumferenceCm ?? '',
    bmi: r.bmi ?? '',
    percentile: r.percentile ?? '',
    weightStatus: r.weightStatus ?? '',
    notes: r.notes ?? '',
  }));

  const parser = new CsvParser({
    fields: ['date', 'heightCm', 'weightKg', 'headCircumferenceCm', 'bmi', 'percentile', 'weightStatus', 'notes'],
  });
  const csv = rows.length ? parser.parse(rows) : 'date,heightCm,weightKg,headCircumferenceCm,bmi,percentile,weightStatus,notes\n';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${child.name}-growth.csv"`);
  await logAction(req, 'REPORT_DOWNLOADED', 'Child', child._id, { type: 'growth-csv' });
  res.send(csv);
});

// GET /api/children/:childId/reports/emergency-card (PDF)
const emergencyCardReport = asyncHandler(async (req, res) => {
  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);

  const doc = startPdf(res, `${child.name}-emergency-card.pdf`);

  doc.roundedRect(50, 50, 495, 320, 12).fillAndStroke('#4F46E5', '#4F46E5');
  doc.fillColor('#fff').fontSize(22).text('Emergency Health Card', 70, 75);
  doc.fontSize(16).text(child.name, 70, 105);
  doc.fontSize(10).fillColor('#e0e7ff').text(`${child.gender} · Blood group: ${child.bloodGroup} · DOB: ${new Date(child.dateOfBirth).toDateString()}`, 70, 128);

  let y = 160;
  const row = (label, value) => {
    doc.fontSize(9).fillColor('#c7d2fe').text(label.toUpperCase(), 70, y);
    doc.fontSize(11).fillColor('#fff').text(value || 'Not recorded', 70, y + 13);
    y += 40;
  };
  row('Allergies', (child.allergies || []).join(', '));
  row('Medical Conditions', (child.medicalConditions || []).join(', '));
  row('Emergency Contact', child.emergencyContact?.name ? `${child.emergencyContact.name} · ${child.emergencyContact.phone || ''}` : null);
  row('Doctor', child.doctor?.name ? `${child.doctor.name} · ${child.doctor.phone || ''}` : null);

  doc.fillColor('#111').fontSize(8).text('Generated by Child Growth Tracker · Keep this card accessible for emergencies.', 50, 390);

  await logAction(req, 'REPORT_DOWNLOADED', 'Child', child._id, { type: 'emergency-card-pdf' });
  doc.end();
});

module.exports = { growthReport, vaccinationReport, summaryReport, growthCsv, emergencyCardReport };
