import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const { koreanText, channel, purpose, tone } = req.body;

  if (!koreanText || !channel || !purpose || !tone) {
    res.status(400).json({
      error: {
        message: "Please fill out all fields",
      }
    });
    return;
  }

  try {
    // Step 1: First Draft
    const firstDraft = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(koreanText, channel, purpose, tone),
      temperature: 0.6,
      max_tokens: 200,
    });
  
    // Step 2: Refine it
    const promptForRefinement = `This is an English copywriting material: "${firstDraft.data.choices[0].text}". Make it polished and catchy, while maintaining the key goal and the fact.`;
  
    const refinedDraft = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: promptForRefinement,
      temperature: 0.6,
      max_tokens: 200,
    });
  
    res.status(200).json({ result: refinedDraft.data.choices[0].text });
    
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}

function generatePrompt(koreanText, channel, purpose, tone) {
  return `Translate the following Korean text into English and create a copy for ${channel} that is ${purpose} and in a ${tone} tone.

Korean Text: ${koreanText}`;
}
