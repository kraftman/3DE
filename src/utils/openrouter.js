import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: window.env.OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const ask = async (content) => {
  console.log('asking:', content);
  const completion = await openai.chat.completions.create({
    model: 'deepseek/deepseek-chat',
    messages: [
      {
        role: 'user',
        content: content,
      },
    ],
  });

  console.log(completion);
  return completion.choices[0].message.content;
};
