import type { DialogueScript } from './dialogue';
export interface QuizQuestion { id: string; category: string; text: string; options: string[]; answer: number; explanation: string }
export interface QuizDefinition { id: string; questions: QuizQuestion[]; durationSeconds?: number; retryUntilCorrect?: boolean; completion?: { speaker: string; lines: string[]; button: string } }
export interface QuizResult { quizId: string; answers: number[]; correct: number; total: number; attempts?: number[] }
// Quiz content supplies every question and explanation; no route-specific behavior.
export class QuizMiniGame {
  private answers: number[] = [];
  private attempts: number[] = [];
  private accepted = 0;
  private deadline: number | null;
  constructor(readonly data: QuizDefinition, now = Date.now()) { this.deadline = data.durationSeconds ? now + data.durationSeconds * 1000 : null; }
  remaining(now = Date.now()) { return this.deadline === null ? null : Math.max(0, Math.ceil((this.deadline - now) / 1000)); }
  get expired() { return this.remaining() === 0; }
  summaryScript(): DialogueScript {
    return { id: `${this.data.id}-summary`, start: 'summary', nodes: {
      summary: { speaker: this.expired ? '时间到' : '已交卷', lines: [`完成：${this.answers.length}\n未完成：${this.data.questions.length - this.answers.length}`], next: 'reaction' },
      reaction: { speaker: '余小迟', lines: ['？'], choices: [{ id: 'quiz-done', text: '收起模拟卷', action: 'quiz-done' }] },
    } };
  }
  choose(id: string) {
    if (this.expired) return;
    const [prefix, q, a] = id.split(':');
    const index = Number(q), answer = Number(a), question = this.data.questions[index];
    if (prefix !== 'quiz' || index !== this.accepted || question?.options[answer] === undefined) return;
    this.answers[index] ??= answer; this.attempts[index] = (this.attempts[index] ?? 0) + 1;
    if (!this.data.retryUntilCorrect || answer === question.answer) this.accepted++;
  }
  get result(): QuizResult { return { quizId: this.data.id, answers: [...this.answers], correct: this.answers.filter((a, i) => a === this.data.questions[i].answer).length, total: this.data.questions.length,
    ...(this.data.retryUntilCorrect ? { attempts: [...this.attempts] } : {}) }; }

  script(): DialogueScript {
    const script: DialogueScript = { id: this.data.id, start: 'q0', nodes: {} };
    this.data.questions.forEach((q, i) => {
      script.nodes[`q${i}`] = { speaker: `${q.category} · ${i + 1}/${this.data.questions.length}`, lines: [q.text], choices: q.options.map((text, a) => ({ id: `quiz:${i}:${a}`, text, next: `f${i}-${a}` })) };
      if (!this.data.durationSeconds) q.options.forEach((_, a) => {
        const correct = a === q.answer;
        script.nodes[`f${i}-${a}`] = {
          speaker: correct ? '答对了' : this.data.retryUntilCorrect ? '再想想' : '答错了', tone: correct ? 'correct' : 'incorrect',
          lines: [correct ? q.explanation : `正确答案：${q.options[q.answer]}。\n${q.explanation}`],
          next: !correct && this.data.retryUntilCorrect ? `q${i}` : i < this.data.questions.length - 1 ? `q${i + 1}` : 'end',
        };
      });
    });
    if (this.data.durationSeconds) {
      this.data.questions.forEach((q, i) => {
        script.nodes[`q${i}`].choices = q.options.map((text, a) => ({ id: `quiz:${i}:${a}`, text,
          ...(i < this.data.questions.length - 1 ? { next: `q${i + 1}` } : { action: 'quiz-submit' }) }));
      });
      return script;
    }
    const end = this.data.completion;
    script.nodes.end = end ? { speaker: end.speaker, lines: end.lines, choices: [{ id: 'quiz-done', text: end.button, action: 'quiz-done' }] } : { speaker: '下一项：性格测试', lines: ['预计用时：35分钟。', '余小迟：“……”'], choices: [{ id: 'quiz-done', text: '合上电脑，出去透口气。', action: 'quiz-done' }] };
    return script;
  }
}
