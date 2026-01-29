import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization to avoid build-time errors
let anthropicInstance: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is niet geconfigureerd');
  }
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop: string | symbol) {
    const instance = getAnthropic();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
