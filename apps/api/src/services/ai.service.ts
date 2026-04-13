import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface CaptionInput {
    title: string
    niche: string
    keywords: string
    platform: string
}

export async function generateCaption({
    title,
    niche,
    keywords,
    platform
}: CaptionInput) {

    const prompt = `
Generate a high quality social media caption.

Video Title: ${title}
Niche: ${niche}
Keywords: ${keywords}
Platform: ${platform}

Return:
Caption
Hashtags
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a social media growth expert." },
            { role: "user", content: prompt }
        ]
    });

    return response.choices[0].message.content;
}