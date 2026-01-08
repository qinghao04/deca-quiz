const { jsonResponse, notAllowed, readJson } = require('../_lib/utils');
const { parseCsv, parseTxt, parsePdf, detectFileType } = require('../_lib/parse');

const MAX_BYTES = 3 * 1024 * 1024;

function extractDriveId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.hostname.includes('drive.google.com')) return null;

    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    const idParam = url.searchParams.get('id');
    if (idParam) return idParam;
  } catch (error) {
    return null;
  }

  return null;
}

function getDriveDownloadUrl(rawUrl) {
  const fileId = extractDriveId(rawUrl);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res, ['POST']);
  }

  try {
    const body = await readJson(req);
    const url = String(body?.url || '').trim();
    if (!url) {
      return jsonResponse(res, 400, { message: 'Share link is required.' });
    }

    const downloadUrl = getDriveDownloadUrl(url);
    if (!downloadUrl) {
      return jsonResponse(res, 400, { message: 'Use a Google Drive file share link.' });
    }

    const response = await fetch(downloadUrl, { redirect: 'follow' });
    if (!response.ok) {
      return jsonResponse(res, 400, { message: 'Unable to download the file.' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return jsonResponse(res, 400, {
        message: 'Make the file public (Anyone with the link) and try again.',
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_BYTES) {
      return jsonResponse(res, 400, { message: 'File is too large (max 3MB).' });
    }

    const buffer = Buffer.from(arrayBuffer);
    const fileType = detectFileType({ contentType, url: downloadUrl });
    const questions =
      fileType === 'pdf'
        ? await parsePdf(buffer)
        : fileType === 'csv'
        ? parseCsv(buffer)
        : parseTxt(buffer);

    return jsonResponse(res, 200, questions.slice(0, 50));
  } catch (error) {
    return jsonResponse(res, 500, { message: 'Unable to import the file.' });
  }
};
