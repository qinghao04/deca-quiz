const { connectDb } = require('../../_lib/db');
const { Quiz, Submission, Progress } = require('../../_lib/models');
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

    const submissions = await Submission.find({ quizId: quiz._id }).sort({ score: -1, createdAt: 1 }).lean();
    const progressEntries = await Progress.find({ quizId: quiz._id }).sort({ updatedAt: -1 }).lean();

    const entryMap = new Map();
    submissions.forEach((entry) => {
      entryMap.set(entry.nickname, {
        nickname: entry.nickname,
        score: entry.score,
        answers: Array.isArray(entry.answers) ? entry.answers : [],
        avatarColor: entry.avatarColor || '',
        lastActivityAt: entry.createdAt,
      });
    });

    progressEntries.forEach((entry) => {
      if (entryMap.has(entry.nickname)) return;
      entryMap.set(entry.nickname, {
        nickname: entry.nickname,
        score: entry.score,
        answers: Array.isArray(entry.answers) ? entry.answers : [],
        avatarColor: entry.avatarColor || '',
        lastActivityAt: entry.updatedAt,
      });
    });

    const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    const entries = Array.from(entryMap.values())
      .map((entry) => {
        const answers = entry.answers || [];
        const statuses = Array.from({ length: questionCount }, (_, index) => {
          const answer = answers[index];
          if (!Number.isInteger(answer) || answer < 0) return 'unanswered';
          return answer === quiz.questions[index]?.correctIndex ? 'correct' : 'wrong';
        });
        return {
          nickname: entry.nickname,
          score: entry.score,
          avatarColor: entry.avatarColor || '',
          statuses,
          lastActivityAt: entry.lastActivityAt,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime();
      });

    return jsonResponse(res, 200, {
      quizId: String(quiz._id),
      quizCode: quiz.quizCode,
      questionCount,
      submissions: entries,
    });
  } catch (error) {
    return jsonResponse(res, 500, { message: 'Unable to load leaderboard.' });
  }
};
