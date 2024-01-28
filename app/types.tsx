export type Quiz = {
  id: string;
  title: string;
  questions: Question[];
  created_at: number;
};

export type Question = {
    questionText: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    answer1: number;
    answer2: number;
    answer3: number;
    answer4: number;
    correctAnswerIndex: number;
}

