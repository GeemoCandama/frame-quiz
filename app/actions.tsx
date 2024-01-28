"use server";

import { kv } from "@vercel/kv";
import { revalidatePath } from "next/cache";
import {Quiz} from "./types";
import {redirect} from "next/navigation";

export async function saveQuiz(quiz: Quiz, formData: FormData) {
  let updatedQuestions = quiz.questions.map((q, index) => ({
      ...q,
      questionText: formData.get(`question${index}`) as string,
      option1: formData.get(`option1-${index}`) as string,
      option2: formData.get(`option2-${index}`) as string,
      option3: formData.get(`option3-${index}`) as string,
      option4: formData.get(`option4-${index}`) as string,
      answer1: 0,
      answer2: 0,
      answer3: 0,
      answer4: 0,
      correctAnswerIndex: parseInt(formData.get(`correctAnswer-${index}`) as string),
  }));

  let newQuiz = {
    ...quiz,
    created_at: Date.now(),
    title: formData.get("title") as string,
    questions: updatedQuestions,
  }

  await kv.hset(`quiz:${quiz.id}`, newQuiz);
  await kv.zadd("quizzes_by_date", {
    score: Number(newQuiz.created_at),
    member: newQuiz.id,
  });

  revalidatePath("/quizzes");
  redirect(`/quizzes/${quiz.id}`);
}

export async function answerQuiz(quiz: Quiz, answers: number[]) {
  answers.forEach(async (answerIndex, questionIndex) => {
    const answerField = `answer${answerIndex}`;
    await kv.hincrby(`quiz:${quiz.id}:question:${questionIndex}`, answerField, 1);
  });

  revalidatePath(`/quizzes/${quiz.id}`);
  redirect(`/quizzes/${quiz.id}?results=true`);
}

export async function redirectToQuizzes() {
  redirect("/quizzes");
}
