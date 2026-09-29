/** A stored quiz, reduced to what grading needs: which option of each question is right. */
export interface GradableQuestion {
  _key: string;
  options?: { _key: string; isCorrect?: boolean | null }[] | null;
}

/** The learner's chosen option `_key` per question `_key`. */
export type QuizAnswers = Record<string, string>;

/**
 * Grades submitted answers against the stored quiz on the server, so a stored score always matches
 * the answers given. An unanswered question, or an option that is not in the quiz, scores zero.
 */
export function gradeQuiz(questions: readonly GradableQuestion[], answers: QuizAnswers) {
  const score = questions.filter((question) =>
    question.options?.some((option) => option._key === answers[question._key] && option.isCorrect === true),
  ).length;
  return { score, total: questions.length };
}
