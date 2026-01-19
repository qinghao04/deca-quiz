const Papa = require('papaparse');
const pdfParse = require('pdf-parse');

function coerceRow(row) {
  if (Array.isArray(row)) return row;
  if (row && typeof row === 'object') return Object.values(row);
  return [];
}

function parseRowToQuestion(row) {
  const values = coerceRow(row);
  if (values.length === 0) return null;
  const question = String(values[0] || '').trim();
  const optionParts = values.slice(1).map((item) => String(item || '').trim()).filter(Boolean);
  if (!question || optionParts.length < 2) return null;

  let correctIndex = 0;
  const last = optionParts[optionParts.length - 1];
  const maybeIndex = Number.parseInt(last, 10);
  if (Number.isInteger(maybeIndex) && maybeIndex >= 0 && maybeIndex < optionParts.length - 1) {
    correctIndex = maybeIndex;
    optionParts.pop();
  }

  return { question, options: optionParts, correctIndex };
}

function normalizeQuestions(rows) {
  return rows.map(parseRowToQuestion).filter(Boolean);
}

function parseCsv(buffer) {
  const text = buffer.toString('utf-8');
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  return normalizeQuestions(parsed.data || []);
}

function parseTxt(buffer) {
  const text = buffer.toString('utf-8');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = lines.map((line) => line.split('|').map((part) => part.trim()));
  return normalizeQuestions(rows);
}

async function parsePdf(buffer) {
  const data = await pdfParse(buffer);
  const lines = String(data.text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rows = lines.map((line) => line.split('|').map((part) => part.trim()));
  return normalizeQuestions(rows);
}

function detectFileType({ contentType = '', name = '', url = '' }) {
  const type = String(contentType).toLowerCase();
  const lowerName = String(name).toLowerCase();
  const lowerUrl = String(url).toLowerCase();

  if (type.includes('pdf') || lowerName.endsWith('.pdf') || lowerUrl.endsWith('.pdf')) {
    return 'pdf';
  }
  if (type.includes('csv') || lowerName.endsWith('.csv') || lowerUrl.endsWith('.csv')) {
    return 'csv';
  }
  if (type.startsWith('text/plain') || lowerName.endsWith('.txt') || lowerUrl.endsWith('.txt')) {
    return 'txt';
  }
  return 'txt';
}

module.exports = { parseCsv, parseTxt, parsePdf, detectFileType };
