import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService, ParsedQuestion, QuizQuestion } from '../../services/api.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-quiz-creator',
  templateUrl: './quiz-creator.component.html',
  styleUrls: ['./quiz-creator.component.css'],
})
export class QuizCreatorComponent implements OnInit {
  maxQuestions = 50;
  maxOptions = 6;
  isUploading = false;
  isImporting = false;
  isSubmitting = false;
  uploadError = '';
  importError = '';
  addQuestionError = '';
  submitError = '';
  submitAttempted = false;
  createdQuiz: { quizId: string; quizCode: string; hostToken: string } | null = null;
  driveLink = new FormControl('');
  activeQuestionIndex = 0;
  showFileHelp = false;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    questions: this.fb.array<FormGroup>([]),
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private session: SessionService
  ) {}

  ngOnInit(): void {
    if (this.questions.length === 0) {
      this.addQuestion(undefined, false);
    }
  }

  get questions(): FormArray<FormGroup> {
    return this.form.get('questions') as FormArray<FormGroup>;
  }

  get joinLink(): string {
    if (!this.createdQuiz) return '';
    return `${window.location.origin}/join?code=${this.createdQuiz.quizCode}`;
  }

  addQuestion(data?: ParsedQuestion, shouldScroll = true) {
    if (this.questions.length >= this.maxQuestions) {
      this.addQuestionError = `You can only add up to ${this.maxQuestions} questions.`;
      return;
    }

    this.addQuestionError = '';

    const options = data?.options?.length ? data.options.slice(0, this.maxOptions) : ['', ''];
    const correctIndex = Number.isInteger(data?.correctIndex) ? (data?.correctIndex as number) : 0;

    const questionGroup = this.fb.group({
      question: [data?.question || '', Validators.required],
      options: this.fb.array(options.map((opt) => this.fb.control(opt, Validators.required))),
      correctIndex: [correctIndex, Validators.min(0)],
    });

    this.questions.push(questionGroup);
    this.setActiveQuestion(this.questions.length - 1);
    if (shouldScroll) {
      this.scrollToQuestion(this.questions.length - 1);
    }
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
    if (this.activeQuestionIndex >= this.questions.length) {
      this.activeQuestionIndex = Math.max(0, this.questions.length - 1);
    }
  }

  optionsAt(index: number): FormArray<FormControl> {
    return this.questions.at(index).get('options') as FormArray<FormControl>;
  }

  addOption(questionIndex: number) {
    const options = this.optionsAt(questionIndex);
    if (options.length >= this.maxOptions) return;
    options.push(this.fb.control('', Validators.required));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.optionsAt(questionIndex);
    if (options.length <= 2) return;
    options.removeAt(optionIndex);
  }

  onFilePicked(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.showFileHelp = true;
    this.handleFile(input.files[0]);
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.showFileHelp = true;
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private handleFile(file: File) {
    this.isUploading = true;
    this.uploadError = '';
    this.api.uploadFile(file).subscribe({
      next: (questions) => {
        if (!this.applyParsedQuestions(questions)) {
          this.uploadError = 'No questions could be parsed from that file.';
        }
        this.isUploading = false;
      },
      error: (error) => {
        this.uploadError = error?.error?.message || 'Upload failed. Please try another file.';
        this.isUploading = false;
      },
    });
  }

  importFromDrive() {
    this.importError = '';
    const link = String(this.driveLink.value || '').trim();
    if (!link) {
      this.importError = 'Paste a Google Drive share link first.';
      return;
    }

    this.isImporting = true;
    this.showFileHelp = true;
    this.api.importFromUrl(link).subscribe({
      next: (questions) => {
        if (!this.applyParsedQuestions(questions)) {
          this.importError = 'No questions could be parsed from that link.';
        } else {
          this.driveLink.setValue('');
        }
        this.isImporting = false;
      },
      error: (error) => {
        this.importError = error?.error?.message || 'Import failed. Check the share link.';
        this.isImporting = false;
      },
    });
  }

  private applyParsedQuestions(questions: ParsedQuestion[]): boolean {
    this.questions.clear();
    if (questions.length === 0) {
      return false;
    }
    this.addQuestionError = '';
    questions.slice(0, this.maxQuestions).forEach((question) => this.addQuestion(question));
    return true;
  }

  setActiveQuestion(index: number) {
    this.activeQuestionIndex = index;
  }

  get questionProgressLabel(): string {
    return `${this.questions.length} / ${this.maxQuestions} questions`;
  }

  get canLaunch(): boolean {
    if (this.form.invalid) return false;
    if (this.questions.length === 0) return false;
    const raw = this.form.getRawValue();
    return !(raw.questions || []).some((item: any) => {
      const question = String(item?.question || '').trim();
      const options = (item?.options || []).map((opt: string) => String(opt || '').trim()).filter(Boolean);
      return !question || options.length < 2;
    });
  }

  private scrollToQuestion(index: number) {
    setTimeout(() => {
      const element = document.getElementById(`question-${index}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  submit() {
    this.submitError = '';
    this.createdQuiz = null;
    this.submitAttempted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Please fill in all required fields.';
      return;
    }

    const raw = this.form.getRawValue();
    const questions: QuizQuestion[] = raw.questions.map((item: any) => {
      const options = (item.options || []).map((opt: string) => String(opt || '').trim()).filter(Boolean);
      let correctIndex = Number(item.correctIndex || 0);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }
      return {
        question: String(item.question || '').trim(),
        options,
        correctIndex,
      };
    });

    if (!raw.title || questions.length === 0) {
      this.submitError = 'Please add a title and at least one question.';
      return;
    }

    const invalidQuestion = (raw.questions || []).some((item: any) => {
      const question = String(item?.question || '').trim();
      const options = (item?.options || []).map((opt: string) => String(opt || '').trim()).filter(Boolean);
      return !question || options.length < 2;
    });

    if (invalidQuestion) {
      this.submitError = 'Each question needs text and at least two options.';
      return;
    }

    this.isSubmitting = true;
    this.api.createQuiz({ title: raw.title, questions }).subscribe({
      next: (result) => {
        this.createdQuiz = {
          quizId: result.quizId,
          quizCode: result.quizCode,
          hostToken: result.hostToken,
        };
        this.session.setHostSession(result.quizId, result.hostToken);
        this.isSubmitting = false;
      },
      error: (error) => {
        this.submitError = error?.error?.message || 'Could not create the quiz.';
        this.isSubmitting = false;
      },
    });
  }
}
