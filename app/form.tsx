"use client";

import clsx from "clsx";
import {useOptimistic, useRef, useState, useTransition} from "react";
import {answerQuiz, redirectToQuizzes, saveQuiz} from "./actions";
import { v4 as uuidv4 } from "uuid";
import {Quiz, Question} from "./types";
import {useRouter, useSearchParams} from "next/navigation";

type QuizState = {
  newQuiz: Quiz;
  updatedPoll?: Quiz;
  pending: boolean;
  answered?: boolean;
};


function createNewQuizQuestion(): Question {
  return {
    questionText: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer1: 0,
    answer2: 0,
    answer3: 0,
    answer4: 0,
    correctAnswerIndex: 1
  };
}

export function QuizCreateForm() {
  let [questions, setQuestions] = useState([createNewQuizQuestion()]);
  let [numQuestions, setNumQuestions] = useState(1);
  let quizRef = useRef<HTMLFormElement>(null);
  let [state, mutate] = useOptimistic(
      { pending: false },
      function createReducer(state, newQuiz: QuizState) {
        if (newQuiz.newQuiz) {
          return {
            pending: newQuiz.pending,
          };
        } else {
          return {
            pending: newQuiz.pending,
          };
        }
      },
  );

  const addNewQuestion = () => {
    setNumQuestions(numQuestions + 1);
    setQuestions([
        ...questions,
        createNewQuizQuestion()
    ]);
  };

  let quizStub = {
    id: uuidv4(),
    created_at: new Date().getTime(),
    title: "",
    questions: [createNewQuizQuestion()]

  };
  let saveWithNewQuiz = saveQuiz.bind(null, quizStub);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let [isPending, startTransition] = useTransition();

  return (
      <>
        <div className="mx-8 w-full">
          <form
              className="relative my-8"
              ref={quizRef}
              action={saveWithNewQuiz}
              onSubmit={(event) => {
                event.preventDefault();
                let formData = new FormData(event.currentTarget);
                let questions = [];

                for (let i = 0; i < numQuestions; i++) {
                  questions.push({
                    questionText: formData.get(`question${i}`) as string,
                    option1: formData.get(`option1-${i}`) as string,
                    option2: formData.get(`option2-${i}`) as string,
                    option3: formData.get(`option3-${i}`) as string,
                    option4: formData.get(`option4-${i}`) as string,
                    answer1: 0,
                    answer2: 0,
                    answer3: 0,
                    answer4: 0,
                    correctAnswerIndex: parseInt(formData.get(`correctAnswer-${i}`) as string)
                  });
                }
                let newQuiz = {
                  ...quizStub,
                  title: formData.get("title") as string,
                  questions: questions,
                };

                quizRef.current?.reset();
                startTransition(async () => {
                  mutate({
                    newQuiz,
                    pending: true,
                  });

                  await saveQuiz(newQuiz, formData);
                });
              }}
          >
            <input
                aria-label="Quiz Title"
                className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                maxLength={150}
                placeholder="Title..."
                required
                type="text"
                name="title"
            />

            {questions.map((question, index) => (
                <div className="question" key={index}>
                    <input
                        aria-label="Question Text"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        placeholder="Question text"
                        required
                        type="text"
                        name={`question${index}`}
                    />
                    <input
                        aria-label="Option 1"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        maxLength={150}
                        placeholder="Option 1"
                        required
                        type="text"
                        name={`option1-${index}`}
                    />
                    <input
                        aria-label="Option 2"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        maxLength={150}
                        placeholder="Option 2"
                        required
                        type="text"
                        name={`option2-${index}`}
                    />
                    <input
                        aria-label="Option 3"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        maxLength={150}
                        placeholder="Option 3"
                        required
                        type="text"
                        name={`option3-${index}`}
                    />
                    <input
                        aria-label="Option 4"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        maxLength={150}
                        placeholder="Option 4"
                        required
                        type="text"
                        name={`option4-${index}`}
                    />
                    <input
                        aria-label="Correct Answer Index"
                        className="pl-3 pr-28 py-3 mt-1 text-lg block w-full border border-gray-200 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-300"
                        placeholder="Correct answer index ex: 1-4"
                        required
                        type="number"
                        name={`correctAnswer-${index}`}
                    />
                </div>
            ))}

            <button 
                type="button" 
                onClick={() => addNewQuestion()}
            >
                Add Question
            </button>
              <div className={"pt-2 flex justify-end"}>
                  <button
                      className={clsx(
                          "flex items-center p-1 justify-center px-4 h-10 text-lg border bg-blue-500 text-white rounded-md w-24 focus:outline-none focus:ring focus:ring-blue-300 hover:bg-blue-700 focus:bg-blue-700",
                          state.pending && "bg-gray-700 cursor-not-allowed",
                      )}
                      type="submit"
                      disabled={state.pending}
                  >
                      Create
                  </button>
              </div>
          </form>
        </div>
          <div className="w-full">
          </div>
      </>
  );
}

function QuestionOptions({quiz, questionIndex, onChange} : {quiz: Quiz, questionIndex: number, onChange: (questionIndex: number, optionIndex: number) => void}) {
    return (
        <div className="mb-4 text-left">
            {[quiz.questions[questionIndex].option1, quiz.questions[questionIndex].option2, quiz.questions[questionIndex].option3, quiz.questions[questionIndex].option4].filter(e => e !== "").map((option, index) => (
                <label key={index} className="block">
                    <input
                        type="radio"
                        name="quiz"
                        value={option}
                        onChange={() => onChange(questionIndex, index)}
                        className="mr-2"
                    />
                    Begin
                </label>
            ))}
        </div>
    );
}

function QuizResults({quiz} : {quiz: Quiz}) {
    console.log(quiz);
     return (
         <div className="mb-4">
             <img src={`/api/image?id=${quiz.id}&results=true&date=${Date.now()}`} alt='quiz results'/>
         </div>
     );
 }

export function QuizAnswerForm({quiz, viewResults}: { quiz: Quiz, viewResults?: boolean }) {
    const [selectedAnswers, setSelectedAnswers] = useState(
        new Array(quiz.questions.length).fill(null)
    );
    const [currentQuestionIndex, setCurrenctQuestionIndex] = useState(0);
    const router = useRouter();
    const searchParams = useSearchParams();
    viewResults = true;     // Only allow taking quiz via the api
    let formRef = useRef<HTMLFormElement>(null);
    let answerOnQuiz = answerQuiz.bind(null, quiz);
    let [isPending, startTransition] = useTransition();
    let [state, mutate] = useOptimistic(
        { showResults: viewResults },
        function createReducer({showResults}, state: QuizState) {
            if (state.answered || viewResults) {
                return {
                    showResults: true,
                };
            } else {
                return {
                    showResults: false,
                };
            }
        },
    );

    const handleAnswer = (questionIndex: number, optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[questionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);

        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrenctQuestionIndex(currentQuestionIndex + 1);
        } else {
            formRef.current?.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        let newQuiz = {
            ...quiz,
            questions: quiz.questions.map((question, index) => {
                return incrementAnswer(question, selectedAnswers[index]);
            }),
        };

        startTransition(async () => {
            mutate({
                newQuiz,
                pending: false,
                answered: true,
            });

            // Process the quiz submission
            await answerOnQuiz(selectedAnswers);  // Assuming this function processes the answers
            await redirectToQuizzes();
        });
    };

    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg p-4 m-4">
            <div className="font-bold text-xl mb-2">{quiz.title}</div>
            <form
                className="relative my-8"
                ref={formRef}
                onSubmit={handleSubmit}
            >
                {state.showResults ? <QuizResults quiz={quiz}/> : <QuestionOptions quiz={quiz} questionIndex={currentQuestionIndex} onChange={handleAnswer}/>}
                {state.showResults ? <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        type="submit"
                    >Back</button> :
                    <button
                        className={"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"}
                        type="submit"
                        disabled={selectedAnswers.length > 0 ? selectedAnswers[0] === null : true}
                    >
                        Answer
                    </button>
                }
            </form>
        </div>
);
}
// (selectedOption < 1 ? " cursor-not-allowed" : "")

function incrementAnswer(question: Question, selectedAnswerIndex: number): Question {
  let updatedQuestion = { ...question };
  switch (selectedAnswerIndex) {
    case 0:
      updatedQuestion.answer1 += 1;
      break;
    case 1:
      updatedQuestion.answer2 += 1;
      break;
    case 2:
      updatedQuestion.answer3 += 1;
      break;
    case 3:
      updatedQuestion.answer4 += 1;
      break;
    default:
      // Handle invalid index, if necessary
      break;
  }
  return updatedQuestion;
}

