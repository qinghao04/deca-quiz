const { connectDb } = require('../../_lib/db');
const { Quiz, Submission, Progress } = require('../../_lib/models');
const { jsonResponse, notAllowed, readJson, sanitizeAnswers, scoreAnswers } = require('../../_lib/utils');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return notAllowed(res, ['POST']);
  }

  try {
    await connectDb();
    const code = String(req.query.code || '').toUpperCase();
    const quiz = await Quiz.findOne({ quizCode: code }).lean();

    if (!quiz) {
      return jsonResponse(res, 404, { message: 'Quiz not found.' });
    }

    const body = await readJson(req);
    const nickname = String(body?.nickname || '').trim();
    const rawAnswers = body?.answers || [];
    const avatarColor = String(body?.avatarColor || '').trim();

    if (!nickname || nickname.length > 20) {
      return jsonResponse(res, 400, { message: 'Nickname is required (max 20 characters).' });
    }

    const answers = sanitizeAnswers(rawAnswers, quiz.questions);
    const score = scoreAnswers(answers, quiz.questions);

    const submission = await Submission.create({
      quizId: quiz._id,
      nickname,
      score,
      answers,
      avatarColor,
      expiresAt: quiz.expiresAt,
    });

    await Progress.deleteOne({ quizId: quiz._id, nickname });

    return jsonResponse(res, 201, {
      submissionId: String(submission._id),
      createdAt: submission.createdAt,
    });
  } catch (error) {
    return jsonResponse(res, 500, { message: 'Unable to submit score.' });
  }
};
