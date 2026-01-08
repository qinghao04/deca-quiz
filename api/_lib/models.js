const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  quizCode: { type: String, required: true, uppercase: true, unique: true },
  hostToken: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

QuizSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SubmissionSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  nickname: { type: String, required: true, trim: true },
  score: { type: Number, required: true },
  answers: { type: [Number], default: [] },
  avatarColor: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

SubmissionSchema.index({ quizId: 1, score: -1, createdAt: 1 });
SubmissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ProgressSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  nickname: { type: String, required: true, trim: true },
  score: { type: Number, required: true },
  answers: { type: [Number], default: [] },
  avatarColor: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

ProgressSchema.index({ quizId: 1, nickname: 1 }, { unique: true });
ProgressSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);
const Submission = mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);
const Progress = mongoose.models.Progress || mongoose.model('Progress', ProgressSchema);

module.exports = { Quiz, Submission, Progress };
