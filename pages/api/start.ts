import type { NextApiRequest, NextApiResponse } from 'next';
import {Quiz} from "@/app/types";
import {kv} from "@vercel/kv";
import {Message} from "@farcaster/hub-nodejs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Process the vote
        // For example, let's assume you receive an option in the body
        try {
            const quizId = req.query['id']
            const results = req.query['results'] === 'true'
            let answered = req.query['answered'] === 'true'
            if (!quizId) {
                return res.status(400).send('Missing quiz ID');
            }

            const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));

            const fid = frameMessage?.data?.fid || 0;
            const answeredOption = await kv.hget(`quiz:${quizId}:answers`, `${fid}`)
            answered = answered || !!answeredOption

            let quiz: Quiz | null = await kv.hgetall(`quiz:${quizId}`);

            if (!quiz) {
                return res.status(400).send('Missing poll ID');
            }     
            let questionOneOptions = ['', '', '', ''];
            let questionOneText = '';
            if (quiz.questions.length > 0) {
               questionOneOptions[0] = quiz.questions[0].option1; 
               questionOneOptions[1] = quiz.questions[0].option2; 
               questionOneOptions[2] = quiz.questions[0].option3; 
               questionOneOptions[3] = quiz.questions[0].option4; 

               questionOneText = quiz.questions[0].questionText;
            }

            const imageUrl = `${process.env['HOST']}/api/image?id=${quiz.id}&qid=0&results=false&date=${Date.now()}${ fid > 0 ? `&fid=${fid}` : '' }`;

            // Return an HTML response
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${questionOneText}</title>
          <meta property="og:title" content="${questionOneText}">
          <meta property="og:image" content="${imageUrl}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${imageUrl}">
          <meta name="fc:frame:post_url" content="${process.env['HOST']}/api/vote?id=${quiz.id}&qid=0&results=false">
          <meta name="fc:frame:button:1" content="${questionOneOptions[0]}">
          <meta name="fc:frame:button:2" content="${questionOneOptions[1]}">
          <meta name="fc:frame:button:3" content="${questionOneOptions[2]}">
          <meta name="fc:frame:button:4" content="${questionOneOptions[3]}">
        </head>
        <body>
        </body>
      </html>
    `);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error generating image');
        }
    } else {
        // Handle any non-POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
