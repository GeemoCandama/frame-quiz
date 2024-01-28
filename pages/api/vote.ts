import type { NextApiRequest, NextApiResponse } from 'next';
import {Quiz} from "@/app/types";
import {kv} from "@vercel/kv";
import {getSSLHubRpcClient, Message} from "@farcaster/hub-nodejs";

const HUB_URL = process.env['HUB_URL'] || "nemes.farcaster.xyz:2283"
const client = getSSLHubRpcClient(HUB_URL);

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

            let validatedMessage : Message | undefined = undefined;
            try {
                const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'));
                const result = await client.validateMessage(frameMessage);
                if (result.isOk() && result.value.valid) {
                    validatedMessage = result.value.message;
                }
            } catch (e)  {
                return res.status(400).send(`Failed to validate message: ${e}`);
            }

            const buttonId = validatedMessage?.data?.frameActionBody?.buttonIndex || 0;
            const fid = validatedMessage?.data?.fid || 0;
            const answeredOption = await kv.hget(`quiz:${quizId}:answers`, `${fid}`)
            answered = answered || !!answeredOption

            if (buttonId > 0 && buttonId < 5 && !results && !answered) {
                let multi = kv.multi();
                multi.hincrby(`quiz:${quizId}`, `votes${buttonId}`, 1);
                multi.hset(`quiz:${quizId}:votes`, {[fid]: buttonId});
                await multi.exec();
            }

            let quiz: Quiz | null = await kv.hgetall(`quiz:${quizId}`);

            if (!quiz) {
                return res.status(400).send('Missing poll ID');
            }
            const imageUrl = `${process.env['HOST']}/api/image?id=${quiz.id}&results=${results ? 'false': 'true'}&date=${Date.now()}${ fid > 0 ? `&fid=${fid}` : '' }`;
            let button1Text = "View Results";
            if (!answered && !results) {
                button1Text = "Back"
            } else if (answered && !results) {
                button1Text = "Already Voted"
            } else if (answered && results) {
                button1Text = "View Results"
            }

            // Return an HTML response
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vote Recorded</title>
          <meta property="og:title" content="Vote Recorded">
          <meta property="og:image" content="${imageUrl}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${imageUrl}">
          <meta name="fc:frame:post_url" content="${process.env['HOST']}/api/vote?id=${quiz.id}&voted=true&results=${results ? 'false' : 'true'}">
          <meta name="fc:frame:button:1" content="${button1Text}">
        </head>
        <body>
          <p>${ results || answered ? `You have already voted ${answeredOption}` : `Your vote for ${buttonId} has been recorded for fid ${fid}.` }</p>
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
