"use client";

import clsx from "clsx";
import {useOptimistic, useRef, useState, useTransition} from "react";
import {answerQuiz, redirectToQuizzes, saveQuiz, votePoll} from "./actions";
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

                for (let i = 0; i < questions.length; i++) {
                  questions.push({
                    questionText: formData.get(`question${i}`) as string,
                    option1: formData.get(`option1-${i}`) as string,
                    option2: formData.get(`option1-${i}`) as string,
                    option3: formData.get(`option1-${i}`) as string,
                    option4: formData.get(`option1-${i}`) as string,
                    answer1: 0,
                    answer2: 0,
                    answer3: 0,
                    answer4: 0,
                    correctAnswerIndex: parseInt(formData.get(`correctAnswer`) as string)
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

// function PollOptions({poll, onChange} : {poll: Poll, onChange: (index: number) => void}) {
//     return (
//         <div className="mb-4 text-left">
//             {[poll.option1, poll.option2, poll.option3, poll.option4].filter(e => e !== "").map((option, index) => (
//                 <label key={index} className="block">
//                     <input
//                         type="radio"
//                         name="poll"
//                         value={option}
//                         onChange={() => onChange(index + 1)}
//                         className="mr-2"
//                     />
//                     {option}
//                 </label>
//             ))}
//         </div>
//     );
// }

function QuizResults({quiz} : {quiz: Quiz}) {
     return (
         <div className="mb-4">
             <img src={`/api/image?id=${quiz.id}&results=true&date=${Date.now()}`} alt='quiz results'/>
         </div>
     );
 }

export function QuizAnswerForm({quiz, viewResults}: { quiz: Quiz, viewResults?: boolean }) {
    const [selectedOption, setSelectedOption] = useState(-1);
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

//    const handleVote = (index: number) => {
//        setSelectedOption(index)
//    };
//
    return (
        <div className="max-w-sm rounded overflow-hidden shadow-lg p-4 m-4">
            <div className="font-bold text-xl mb-2">{quiz.title}</div>
            <form
                className="relative my-8"
                ref={formRef}
                action={ () => voteOnPoll(selectedOption)}
                onSubmit={(event) => {
                    event.preventDefault();
                    let formData = new FormData(event.currentTarget);
                    let newQuiz = {
                        ...quiz,
                    };

                    // @ts-ignore
                    newQuiz[`votes${selectedOption}`] += 1;

                    formRef.current?.reset();
                    startTransition(async () => {
                        mutate({
                            newQuiz,
                            pending: false,
                            answered: true,
                        });

//                        await redirectToPolls();
                        // await votePoll(newPoll, selectedOption);
                    });
                }}
            >
                {state.showResults ? <QuizResults quiz={quiz}/> : <PollOptions poll={poll} onChange={handleVote}/>}
                {state.showResults ? <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        type="submit"
                    >Back</button> :
                    <button
                        className={"bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" + (selectedOption < 1 ? " cursor-not-allowed" : "")}
                        type="submit"
                        disabled={selectedOption < 1}
                    >
                        Vote
                    </button>
                }
            </form>
        </div>
);
}
