import {kv} from "@vercel/kv";
import {Quiz} from "@/app/types";
import Link from "next/link";

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

async function getQuizzes() {
    try {
        let quizIds = await kv.zrange("quizzes_by_date", Date.now(), Date.now() - SEVEN_DAYS_IN_MS, {byScore: true, rev: true});

        if (!quizIds.length) {
            return [];
        }

        let multi = kv.multi();
        quizIds.forEach((id) => {
            multi.hgetall(`quiz:${id}`);
        });

        let items: Quiz[] = await multi.exec();
        return items.map((item) => {
            return {...item};
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function Page() {
    const quizzes = await getQuizzes();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
                <h1 className="text-lg sm:text-2xl font-bold mb-2">
                    Created Quizzes
                </h1>
                <div className="flex-1 flex-wrap items-center justify-around max-w-4xl my-8 sm:w-full bg-white rounded-md shadow-xl h-full border border-gray-100">
                    {
                        quizzes.map((quiz) => {
                        // returns links to quiz ids
                        return (<div key={quiz.id}>
                            <a href={`/quizzes/${quiz.id}`} className="underline">
                                <p className="text-md sm:text-xl mx-4">{quiz.title}</p>
                            </a>
                        </div>)
                        })
                    }
                </div>
                <Link href="/">
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Create Quiz
                    </button>
                </Link>
            </main>
        </div>
    );
}
