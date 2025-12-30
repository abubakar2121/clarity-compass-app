import { Question, CompanySize } from "@/lib/types";

import mockQuestionsData from './questions.json';

export const mockQuestions: Question[] = mockQuestionsData as any;

export const getQuestionsForCompanySize = (companySize: CompanySize): Question[] => {
  const filteredQuestions = mockQuestions.filter(q => q.stage_applicability.includes(companySize));

  // Shuffle the filtered questions to provide a slightly different experience each time
  const shuffledQuestions = filteredQuestions.sort(() => 0.5 - Math.random());

  // Ensure we get between 10 and 12 questions.
  // If there are fewer than 10 applicable questions, we'll return all of them.
  // If there are more than 12, we'll take a slice of 12.
  const numberOfQuestionsToSelect = Math.min(Math.max(shuffledQuestions.length, 10), 12);

  return shuffledQuestions.slice(0, numberOfQuestionsToSelect);
};