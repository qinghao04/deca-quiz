const crypto = require('crypto');

function jsonResponse(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function notAllowed(res, methods = ['GET', 'POST']) {
  res.setHeader('Allow', methods.join(', '));
  return jsonResponse(res, 405, { message: 'Method Not Allowed' });
}

function readJson(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function generateQuizCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

function sanitizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions
    .map((item) => {
      const question = String(item?.question || '').trim();
      const options = Array.isArray(item?.options)
        ? item.options.map((opt) => String(opt || '').trim()).filter(Boolean)
        : [];
      const correctIndex = Number(item?.correctIndex ?? 0);
      if (!question || options.length < 2) return null;
      const safeIndex =
        Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex < options.length
          ? correctIndex
          : 0;
      return { question, options, correctIndex: safeIndex };
    })
    .filter(Boolean);
}

function sanitizeAnswers(rawAnswers, questions) {
  const questionCount = Array.isArray(questions) ? questions.length : 0;
  const answers = Array.isArray(rawAnswers) ? rawAnswers : [];
  const sanitized = Array.from({ length: questionCount }, () => -1);

  answers.forEach((value, index) => {
    if (index >= questionCount) return;
    const question = questions[index];
    const optionCount = Array.isArray(question?.options) ? question.options.length : 0;
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < optionCount) {
      sanitized[index] = parsed;
    }
  });

  return sanitized;
}

function scoreAnswers(answers, questions) {
  if (!Array.isArray(answers) || !Array.isArray(questions)) return 0;
  return answers.reduce((total, answer, index) => {
    const correctIndex = questions[index]?.correctIndex;
    return total + (answer === correctIndex ? 1 : 0);
  }, 0);
}

module.exports = {
  jsonResponse,
  notAllowed,
  readJson,
  generateQuizCode,
  generateToken,
  sanitizeQuestions,
  sanitizeAnswers,
  scoreAnswers,
};
