// reports.js — Triggers report downloads (PDF/CSV) via the API's blob download helper.

import { api } from './api.js';
import { showToast } from './components/toast.js';

const REPORT_ENDPOINTS = {
  growth: (childId) => `/children/${childId}/reports/growth`,
  vaccination: (childId) => `/children/${childId}/reports/vaccination`,
  summary: (childId) => `/children/${childId}/reports/summary`,
  csv: (childId) => `/children/${childId}/reports/growth.csv`,
};

export async function downloadReport(childId, childName, type) {
  const path = REPORT_ENDPOINTS[type]?.(childId);
  if (!path) return;

  const filenames = {
    growth: `${childName}-growth-report.pdf`,
    vaccination: `${childName}-vaccination-report.pdf`,
    summary: `${childName}-summary-report.pdf`,
    csv: `${childName}-growth.csv`,
  };

  try {
    await api.download(path, filenames[type]);
    showToast('Download started', 'success');
  } catch (err) {
    showToast(err.message || 'Could not generate the report', 'error');
  }
}
