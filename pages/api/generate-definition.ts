import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  definition?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { word } = req.body;

  if (!word) {
    return res.status(400).json({ error: 'Word is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that creates very simple, short definitions for 8-year-olds. Write ONLY one short sentence (max 10 words). Use very simple words. NEVER include the word being defined anywhere in the definition. Do not add any explanation or extra text, just the definition.',
          },
          {
            role: 'user',
            content: `Write a one-sentence definition (max 10 words) for "${word}" for an 8-year-old. NEVER use the word "${word}" in the definition. Just write the definition, nothing else.`,
          },
        ],
        max_tokens: 30,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Failed to generate definition' });
    }

    const data = await response.json();
    let definition =
      data.choices?.[0]?.message?.content || 'Unable to generate definition';

    // Clean up the definition - remove quotes if present
    definition = definition.replace(/^["']|["']$/g, '').trim();

    res.status(200).json({ definition });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
