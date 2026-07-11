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
              'You are a helpful assistant that creates simple, child-friendly definitions for words. Keep definitions to 1-2 sentences, use simple language a 7-10 year old would understand, and make them engaging.',
          },
          {
            role: 'user',
            content: `Create a simple, child-friendly definition for the word "${word}". Keep it to 1-2 sentences.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Failed to generate definition' });
    }

    const data = await response.json();
    const definition =
      data.choices?.[0]?.message?.content || 'Unable to generate definition';

    res.status(200).json({ definition: definition.trim() });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
