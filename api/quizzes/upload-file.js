const multer = require('multer');
const { jsonResponse, notAllowed } = require('../_lib/utils');
const { parseCsv, parseTxt, parsePdf, detectFileType } = require('../_lib/parse');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res, ['POST']);
  }

  return upload.single('file')(req, res, async (err) => {
    if (err) {
      return jsonResponse(res, 400, { message: 'File upload failed.' });
    }

    const file = req.file;
    if (!file) {
      return jsonResponse(res, 400, { message: 'No file provided.' });
    }

    try {
      const fileType = detectFileType({
        contentType: file.mimetype,
        name: file.originalname,
      });
      const questions =
        fileType === 'pdf'
          ? await parsePdf(file.buffer)
          : fileType === 'csv'
          ? parseCsv(file.buffer)
          : parseTxt(file.buffer);
      return jsonResponse(res, 200, questions.slice(0, 50));
    } catch (error) {
      return jsonResponse(res, 400, { message: 'Unable to parse file.' });
    }
  });
};
