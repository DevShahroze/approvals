import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@/lib/env";
import { ActivityLog } from "@/lib/db/models";

const RETRY_DELAYS = [1000, 2000, 4000];

export class ClaudeClient {
  constructor() {
    const env = getEnv();
    this.apiKey = env.ANTHROPIC_API_KEY;
    this.defaultModel = env.CLAUDE_MODEL_DEFAULT;
    this.lightModel = env.CLAUDE_MODEL_LIGHT;
    this.client = this.apiKey ? new Anthropic({ apiKey: this.apiKey }) : null;
    this.lastRequestAt = 0;
    this.minIntervalMs = 500;
  }

  isConfigured() {
    return Boolean(this.client);
  }

  async throttle() {
    const now = Date.now();
    const wait = this.minIntervalMs - (now - this.lastRequestAt);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastRequestAt = Date.now();
  }

  estimateCost(model, inputTokens, outputTokens) {
    const rates = {
      default: { in: 3 / 1e6, out: 15 / 1e6 },
      light: { in: 0.8 / 1e6, out: 4 / 1e6 },
    };
    const tier = model.includes("haiku") ? rates.light : rates.default;
    return inputTokens * tier.in + outputTokens * tier.out;
  }

  async logUsage(userId, model, usage, promptVersion) {
    if (!usage) return;
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    await ActivityLog.create({
      userId,
      type: "ai",
      message: `Claude call (${promptVersion})`,
      metadata: { model, promptVersion },
      tokenUsage: {
        inputTokens,
        outputTokens,
        model,
        estimatedCostUsd: this.estimateCost(model, inputTokens, outputTokens),
      },
    });
  }

  async messages({ userId, model, system, messages, max_tokens = 4096, promptVersion = "v1" }) {
    if (!this.client) {
      return { not_configured: true, error: "ANTHROPIC_API_KEY is not set" };
    }

    let lastError;
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        await this.throttle();
        const response = await this.client.messages.create({
          model: model || this.defaultModel,
          max_tokens,
          system,
          messages,
        });

        const text = response.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n");

        if (userId) {
          await this.logUsage(userId, response.model, response.usage, promptVersion);
        }

        return { text, usage: response.usage, model: response.model };
      } catch (err) {
        lastError = err;
        const status = err.status || err.statusCode;
        if (status === 429 && attempt < RETRY_DELAYS.length) {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async structuredJson({ userId, model, system, userPrompt, schemaHint, promptVersion }) {
    const systemWithJson = `${system}\n\nRespond with valid JSON only, no markdown fences. Schema: ${schemaHint}`;
    const result = await this.messages({
      userId,
      model: model || this.lightModel,
      system: systemWithJson,
      messages: [{ role: "user", content: userPrompt }],
      promptVersion,
    });

    if (result.not_configured) {
      return result;
    }

    try {
      const parsed = JSON.parse(result.text.trim());
      return { data: parsed, usage: result.usage };
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (match) {
        return { data: JSON.parse(match[0]), usage: result.usage };
      }
      throw new Error("Claude returned non-JSON response");
    }
  }
}

export const claudeClient = new ClaudeClient();
