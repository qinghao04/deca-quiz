const { connectDb } = require('../_lib/db');
const { Quiz } = require('../_lib/models');
const {
  jsonResponse,
  notAllowed,
  readJson,
  generateQuizCode,
  generateToken,
  sanitizeQuestions,
} = require('../_lib/utils');

const QUIZ_TTL_MS = 10 * 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res, ['POST']);
  }

  try {
    await connectDb();
    const body = await readJson(req);
    const title = String(body?.title || '').trim();
    const questions = sanitizeQuestions(body?.questions || []);

    if (!title || title.length > 80) {
      return jsonResponse(res, 400, { message: 'Title is required (max 80 characters).' });
    }

    if (questions.length === 0) {
      return jsonResponse(res, 400, { message: 'Please include at least one valid question.' });
    }

    let quizCode = generateQuizCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const exists = await Quiz.findOne({ quizCode }).lean();
      if (!exists) break;
      quizCode = generateQuizCode();
    }

    const expiresAt = new Date(Date.now() + QUIZ_TTL_MS);
    const quiz = await Quiz.create({
      title,
      quizCode,
      hostToken: generateToken(),
      questions,
      expiresAt,
    });

    return jsonResponse(res, 201, {
      quizId: String(quiz._id),
      quizCode: quiz.quizCode,
      hostToken: quiz.hostToken,
      createdAt: quiz.createdAt,
    });
  } catch (error) {
    return jsonResponse(res, 500, { message: 'Unable to create quiz.' });
  }
};
