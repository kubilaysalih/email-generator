import type { NextApiRequest, NextApiResponse } from 'next';

// Define types for API interactions
interface RequestBody {
  prompt: string;
  currentMjml?: string;
  image?: string | null;
  sessionId?: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | ContentItem[];
}

interface ContentItem {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface ClaudeResponse {
  type: string;
  delta?: {
    text?: string;
  };
}

interface StreamChunk {
  content?: string;
  type?: 'structure_start' | 'structure_end' | 'content';
  sessionId?: string;
  error?: string;
}

// API configuration
export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
};

// Chat session storage (memory-based)
// In production, consider using a database or Redis
const chatSessions: Record<string, ChatMessage[]> = {};

// MJML template structure
const MJML_TEMPLATE = {
  start: `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
`,
  end: `      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
};

// Maximum number of messages to keep in chat history
const MAX_CHAT_HISTORY = 10;

/**
 * Writes a chunk to the response stream in SSE format
 */
const writeChunk = (res: NextApiResponse, data: StreamChunk): void => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Use flush when available (not in all environments)
  if ('flush' in res && typeof res.flush === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).flush();
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Set headers for Server-Sent Events (SSE)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  try {
    const { prompt, image, sessionId } = req.body as RequestBody;

    // Validate required fields
    if (!prompt || prompt.trim() === '') {
      writeChunk(res, { error: 'Prompt gerekli' });
      return res.end();
    }

    // Generate or use provided session ID
    const activeSessionId = sessionId || `session_${Date.now()}`;

    // Initialize chat history for new sessions
    if (!chatSessions[activeSessionId]) {
      chatSessions[activeSessionId] = [];
    }

    // Define system prompt for Claude
    const systemPrompt = `
Sen bir e-posta içeriği oluşturma asistanısın. Görevin, kullanıcının isteğine göre e-posta içeriği oluşturmak.

Yanıtın şunlardan BİRİ olabilir:
1. <mj-text> etiketleri içeren içerik (örn: <mj-text font-size="20px" color="#F45E43">Başlık</mj-text>)
2. Diğer MJML içerik etiketleri (<mj-image>, <mj-button>, <mj-divider>, vb.)

Aşağıdaki MJML etiketlerini kullanabilirsin:
- <mj-html-attributes> (attributes için)
- <mj-html-attribute> (tekil attribute eklemek için)
- <mj-selector> (select işlemi için)
- <mj-text> (metin için)
- <mj-image> (görseller için, src="https://placehold.co//600x200" şeklinde yer tutucu kullanabilirsin)
- <mj-button> (butonlar için)
- <mj-divider> (ayraçlar için)
- <mj-spacer> (boşluk için)
- <mj-social> (sosyal medya butonları için)

ÖNEMLİ: <mjml>, <mj-body>, gibi wrapper etiketleri KULLANMA!
SADECE e-posta içeriğini oluştur.

Örnek:
<mj-text font-size="20px" color="#F45E43" font-family="helvetica">Hoş Geldiniz!</mj-text>
<mj-text font-size="16px" color="#333333">İşte size özel tekliflerimiz...</mj-text>
<mj-button background-color="#FF0000" href="https://example.com">Hemen İncele</mj-button>
<mj-column width="50%"> kullanırsan iki kolon oluşturur bu aklında olsun

Şu örnek bir kullanım var. Kolon üretmeyi falan burdan görürsün: <mj-column> eğer <mj-section> un içerisinde olursa yanyana olabilirler. Yoksa yanyana sıralanmıyorlar.

Renkleri ve yazı tiplerini tasarıma uygun olarak kullan. İçerik kısa ve öz olsun.
`;

    // Build user message content
    let messageContent: string | ContentItem[];

    if (image) {
      // If there's an image, send both image and text
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: image
          }
        },
        {
          type: "text",
          text: prompt
        }
      ];
    } else {
      // Text only
      messageContent = prompt;
    }

    // Add the current user message to chat history
    chatSessions[activeSessionId].push({
      role: "user",
      content: messageContent
    });

    // Send initial session ID to client
    writeChunk(res, { sessionId: activeSessionId });

    // Send MJML opening structure
    writeChunk(res, {
      content: MJML_TEMPLATE.start,
      type: 'structure_start',
      sessionId: activeSessionId
    });

    // Make request to Claude API with chat history
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        system: systemPrompt,
        stream: true,
        messages: chatSessions[activeSessionId]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorData}`);
    }

    if (!response.body) {
      throw new Error('No response body from Claude API');
    }

    // Stream response processing
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let assistantResponse = ''; // Accumulate Claude's complete response

    // Process the stream
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        // End of stream processing

        // Save assistant response to chat history
        if (assistantResponse) {
          chatSessions[activeSessionId].push({
            role: "assistant",
            content: assistantResponse
          });

          // Prune history if it gets too long
          if (chatSessions[activeSessionId].length > MAX_CHAT_HISTORY) {
            chatSessions[activeSessionId] = chatSessions[activeSessionId].slice(-MAX_CHAT_HISTORY);
          }
        }

        // Send closing MJML structure
        writeChunk(res, {
          content: MJML_TEMPLATE.end,
          type: 'structure_end'
        });

        // Signal end of stream
        res.write(`data: [DONE]\n\n`);
        break;
      }

      // Decode chunk and add to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep last incomplete line

      for (const line of lines) {
        if (line.trim() === '') continue;

        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim();

            if (jsonStr === '[DONE]') {
              continue; // Skip, we'll handle stream end in the done block
            }

            const data = JSON.parse(jsonStr) as ClaudeResponse;

            // Process content blocks
            if (data.type === 'content_block_delta' &&
                data.delta?.text) {

              const contentChunk = data.delta.text;
              assistantResponse += contentChunk;

              // Forward content to client
              writeChunk(res, {
                content: contentChunk,
                type: 'content'
              });
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, 'Line:', line);
          }
        }
      }
    }

    // End the response
    res.end();
  } catch (error) {
    console.error('API error:', error);

    // Extract error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Send error to client
    writeChunk(res, { error: errorMessage });
    res.end();
  }
}