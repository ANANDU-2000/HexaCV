import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  temperature?: number;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const assertApiKey = () => {
  if (!ENV.forgeApiKey && !ENV.grokApiKey && !ENV.geminiApiKey && !ENV.geminiApiKey2) {
    throw new Error("No API key is configured. Please set BUILT_IN_FORGE_API_KEY, GEMINI_API_KEY, GEMINI_API_KEY_2, or GROK_API_KEY in .env");
  }
};

type ApiKeyConfig = { apiKey: string; url: string; defaultModel?: string; isOpenAI?: boolean };

const getApiKeyConfigs = (): ApiKeyConfig[] => {
  const configs: ApiKeyConfig[] = [];

  if (ENV.forgeApiKey) {
    configs.push({
      apiKey: ENV.forgeApiKey,
      url:
        ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions",
    });
  }
  if (ENV.geminiApiKey) {
    configs.push({
      apiKey: ENV.geminiApiKey,
      url: "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions",
      defaultModel: "gemini-1.5-flash",
    });
  }
  if (ENV.geminiApiKey2) {
    configs.push({
      apiKey: ENV.geminiApiKey2,
      url: "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions",
      defaultModel: "gemini-1.5-flash",
    });
  }
  if (ENV.grokApiKey) {
    configs.push({
      apiKey: ENV.grokApiKey,
      url: "https://api.groq.com/openai/v1/chat/completions",
      defaultModel: "llama-3.3-70b-versatile",
    });
  }

  return configs;
};

const hasOpenAIConfig = (configs: ApiKeyConfig[]): boolean =>
  configs.some((c) => !!c.isOpenAI);

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
const fetchWithBackoff = async (
  url: string,
  init: FetchInit
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after exhausting retries");
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    temperature,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }

  if (typeof temperature === "number") {
    payload.temperature = temperature;
  }

  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const configs = getApiKeyConfigs();
  const openAIConfigured = hasOpenAIConfig(configs);
  let lastError: Error | null = null;

  for (const config of configs) {
    const requestPayload = { ...payload };
    
    // Map OpenAI model names (like gpt-4o) to the provider's defaultModel
    // when no OpenAI credentials are configured.
    let resolvedModel = model;
    if (!openAIConfigured && config.defaultModel && model?.startsWith("gpt-")) {
      resolvedModel = config.defaultModel;
    }
    
    requestPayload.model = resolvedModel || config.defaultModel || requestPayload.model;

    try {
      const response = await fetchWithBackoff(config.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(
          `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
        );
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          console.warn(`LLM key failed (${response.status}), trying next configured key...`);
          lastError = err;
          continue;
        }
        throw err;
      }

      return (await response.json()) as InvokeResult;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (configs.length > 1) {
        console.warn("LLM request failed, trying next configured API key...");
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("LLM invoke failed: no API keys available");
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();

  const configs = getApiKeyConfigs();
  const config = configs[0];
  const url = config.url.replace("/chat/completions", "/models");

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${config.apiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as ModelsResponse;
}
