import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';
import {Quiz, Question} from "@/app/types";
import {kv} from "@vercel/kv";
import satori from "satori";
import { join } from 'path';
import * as fs from "fs";

const fontPath = join(process.cwd(), 'Roboto-Regular.ttf')
let fontData = fs.readFileSync(fontPath)

export function getTotalAnswers(question: Question): number {
    return question.answer1 + question.answer2 + question.answer3 + question.answer4;
}

function getPercentCorrect(question: Question): number {
    const totalAnswers = getTotalAnswers(question);
    if (totalAnswers === 0) return 0;

    const correctAnswersCount = question[`answer${question.correctAnswerIndex}` as keyof Question] as number;
    return (correctAnswersCount / totalAnswers) * 100;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const quizId = req.query['id'];
        const questionId = parseInt(req.query['qid']?.toString() || '');
        // const fid = parseInt(req.query['fid']?.toString() || '')
        if (!quizId) {
            return res.status(400).send('Missing quiz ID');
        }

        let quiz: Quiz | null = await kv.hgetall(`quiz:${quizId}`);


        if (!quiz) {
            return res.status(400).send('Invalid quiz ID');
        }

        let validQuestionId: number | null = questionId  < quiz.questions.length ? questionId : null;

        const showResults = req.query['results'] === 'true'
        // let votedOption: number | null = null
        // if (showResults && fid > 0) {
        //     votedOption = await kv.hget(`poll:${pollId}:votes`, `${fid}`) as number
        // }

        // const pollOptions = [poll.option1, poll.option2, poll.option3, poll.option4]
        const percentCorrectArr = quiz.questions.map(question => getPercentCorrect(question));
        const quizAverage = percentCorrectArr.length > 0 ? percentCorrectArr.reduce((sum, percent) => sum + percent, 0) / percentCorrectArr.length : 0;
        const timesTaken = quiz.questions.length > 0 ? getTotalAnswers(quiz.questions[0]) : 0;
        const quizData = {
            quiz: showResults ? `Results for ${quiz.title}` : quiz.title,
            quizAverage: showResults ? `${quizAverage}%` : '',
            questions: quiz.questions
                .map((question, index) => {
                    // @ts-ignore
                    let percentCorrect = percentCorrectArr[index];
                    let text = showResults ? `${percentCorrectArr[index]}%: ${question.questionText}` : `${index + 1}. ${question.questionText}`;
                    return { question, text, percentCorrect}
                })
        };

        const svg = await satori(
            <div style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                display: 'flex',
                width: '100%',
                height: '100%',
                backgroundColor: 'f4f4f4',
                padding: 50,
                lineHeight: 1.2,
                fontSize: 24,
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 20,
                }}>
                    <h2 style={{textAlign: 'center', color: 'lightgray'}}>{validQuestionId != null ? quiz.questions[validQuestionId].questionText : quiz.title}</h2>
                    {
                        (validQuestionId != null) ? (
                          <>
                           <div style={{
                                color: '#fff',
                                padding: 10,
                                marginBottom: 10,
                                borderRadius: 4,
                                width: `100%`,
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                            }}>{quiz.questions[validQuestionId].option1}</div>
                           <div style={{
                                color: '#fff',
                                padding: 10,
                                marginBottom: 10,
                                borderRadius: 4,
                                width: `100%`,
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                            }}>{quiz.questions[validQuestionId].option1}</div>
                           <div style={{
                                color: '#fff',
                                padding: 10,
                                marginBottom: 10,
                                borderRadius: 4,
                                width: `100%`,
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                            }}>{quiz.questions[validQuestionId].option1}</div>
                           <div style={{
                                color: '#fff',
                                padding: 10,
                                marginBottom: 10,
                                borderRadius: 4,
                                width: `100%`,
                                whiteSpace: 'nowrap',
                                overflow: 'visible',
                            }}>{quiz.questions[validQuestionId].option1}</div>
                          </>
                        ) : (
                            quizData.questions.map((q, index) => {
                                return (
                                    <div style={{
                                        backgroundColor:  showResults ? '#007bff' : '',
                                        color: '#fff',
                                        padding: 10,
                                        marginBottom: 10,
                                        borderRadius: 4,
                                        width: `${showResults ? q.percentCorrect : 100}%`,
                                        whiteSpace: 'nowrap',
                                        overflow: 'visible',
                                    }}>{q.text}</div>
                                )
                            })
                        )
                    }
                    {showResults ? <h3 style={{color: "darkgray"}}>Average Score: {quizAverage} (Taken: {timesTaken})</h3> : ''}
                </div>
            </div>
            ,
            {
                width: 600, height: 400, fonts: [{
                    data: fontData,
                    name: 'Roboto',
                    style: 'normal',
                    weight: 400
                }]
            })

        // Convert SVG to PNG using Sharp
        const pngBuffer = await sharp(Buffer.from(svg))
            .toFormat('png')
            .toBuffer();

        // Set the content type to PNG and send the response
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'max-age=10');
        res.send(pngBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating image');
    }
}
