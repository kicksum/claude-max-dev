const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Pricing per million tokens (input/output)
const PRICING = {
  'claude-3-5-haiku-20241022': { input: 1.00, output: 5.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-opus-4-20250514': { input: 15.00, output: 75.00 },
};

function calculateCost(model, inputTokens, outputTokens) {
  const pricing = PRICING[model] || PRICING['claude-sonnet-4-20250514'];
  const inputCost = (inputTokens / 1000000) * pricing.input;
  const outputCost = (outputTokens / 1000000) * pricing.output;
  return inputCost + outputCost;
}

async function sendMessage(messages, model = 'claude-sonnet-4-20250514', maxTokens = 4096) {
  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      messages: messages,
    });

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateCost(model, inputTokens, outputTokens);

    return {
      content: response.content[0].text,
      inputTokens,
      outputTokens,
      cost,
      model: response.model,
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

module.exports = {
  sendMessage,
  calculateCost,
  PRICING
};
