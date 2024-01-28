import {kv} from "@vercel/kv";
import {Quiz} from "@/app/types";
import {QuizAnswerForm} from "@/app/form";
import Head from "next/head";
import {Metadata, ResolvingMetadata} from "next";

async function getQuiz(id: string): Promise<Quiz> {
    let nullQuiz = {
        id: "",
        title: "No quiz found",
        questions: [],
        created_at: 0,
    };

    try {
        let quiz: Quiz | null = await kv.hgetall(`quiz:${id}`);

        if (!quiz) {
            return nullQuiz;
        }

        return quiz;
    } catch (error) {
        console.error(error);
        return nullQuiz;
    }
}

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    // read route params
    const id = params.id
    const quiz = await getQuiz(id)

    const fcMetadata: Record<string, string> = {
        "fc:frame": "vNext",
        "fc:frame:post_url": `${process.env['HOST']}/api/vote?id=${id}`,
        "fc:frame:image": `${process.env['HOST']}/api/image?id=${id}`,
    };
    if(quiz.questions.length > 0) {
    [quiz.questions[0].option1, quiz.questions[0].option2, quiz.questions[0].option3, quiz.questions[0].option4].filter(o => o !== "").map((option, index) => {
        fcMetadata[`fc:frame:button:${index + 1}`] = option;
    })
    }

    return {
        title: quiz.title,
        openGraph: {
            title: quiz.title,
            images: [`/api/image?id=${id}`],
        },
        other: {
            ...fcMetadata,
        },
        metadataBase: new URL(process.env['HOST'] || '')
    }
}

// function getMeta(
//     poll: Poll
// ) {
//     // This didn't work for some reason
//     return (
//         <Head>
//             <meta property="og:image" content="" key="test"></meta>
//             <meta property="og:title" content="My page title" key="title"/>
//         </Head>
//     );
// }


export default async function Page({params}: { params: {id: string}}) {
    const quiz = await getQuiz(params.id);

    return(
        <>
            <div className="flex flex-col items-center justify-center min-h-screen py-2">
                <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
                    <QuizAnswerForm quiz={quiz}/>
                </main>
            </div>
        </>
    );

}
