const { connectDb } = require('../../_lib/db');
const { Quiz } = require('../../_lib/models');
const { jsonResponse, notAllowed } = require('../../_lib/utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return notAllowed(res, ['GET']);
  }

  try {
    await connectDb();
    const code = String(req.query.code || '').toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code }).lean();

    if (!quiz) {
      return jsonResponse(res, 404, { message: 'Quiz not found.' });
    }

    return jsonResponse(res, 200, {
      quizId: String(quiz._id),
      quizCode: quiz.quizCode,
      title: quiz.title,
      questions: quiz.questions || [],
      createdAt: quiz.createdAt,
    });
  } catch (error) {
    return jsonResponse(res, 500, { message: 'Unable to load quiz.' });
  }
};
