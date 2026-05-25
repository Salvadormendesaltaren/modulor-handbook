import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findContentDir(tier) {
  const candidates = [
    join(__dirname, '..', '_content', 'current', tier),
    join(process.cwd(), '_content', 'current', tier),
    join('/var/task', '_content', 'current', tier),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

function loadTierContent(tier) {
  const dir = findContentDir(tier);
  if (!dir) return '';

  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  const parts = [];
  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8');
    parts.push(`--- ${file} ---\n${content}`);
  }
  return parts.join('\n\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth: same pattern as content.js ──
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = match[1];
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Chat not configured' });
  }

  // Verify JWT
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!userRes.ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await userRes.json();
  const domain = user.email.split('@')[1];

  // DB headers
  const dbHeaders = SERVICE_KEY
    ? { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    : { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${token}` };

  // Check domain + leadership in parallel
  const [domainRes, leadershipRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/approved_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`,
      { headers: dbHeaders }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/leadership_users?email=eq.${encodeURIComponent(user.email)}&select=email`,
      { headers: dbHeaders }
    ),
  ]);

  const domainData = await domainRes.json();
  if (!Array.isArray(domainData) || domainData.length === 0) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const leadershipData = await leadershipRes.json();
  const isLeadership = Array.isArray(leadershipData) && leadershipData.length > 0;

  // ── Tier enforcement: leadership → full/, team → redux/ ──
  const tier = isLeadership ? 'full' : 'redux';
  const handbookContent = loadTierContent(tier);

  if (!handbookContent) {
    return res.status(500).json({ error: 'Content not available' });
  }

  // ── Parse request body ──
  let messages;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages required' });
    }
    // Limit conversation history to prevent abuse
    if (messages.length > 40) {
      messages = messages.slice(-40);
    }
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // ── Build system prompt ──
  const systemPrompt = `Eres el asistente del Handbook de Modulor Studios. Conoces en profundidad el contenido del handbook y ayudas al equipo a entenderlo, navegarlo y aplicarlo.

CÓMO RESPONDER:
- Basa tus respuestas en el contenido del handbook proporcionado abajo. Cuando la pregunta requiera conectar información de distintas secciones (por ejemplo, comparar boutiques, analizar sinergias o explicar cómo encajan distintas piezas del grupo), sintetiza y elabora una respuesta coherente y natural en lugar de limitarte a copiar fragmentos sueltos.
- Si la pregunta es ambigua o demasiado amplia, haz preguntas de vuelta para entender mejor qué necesita el usuario antes de responder. Por ejemplo: "¿Te refieres a la estructura del equipo o a los servicios que ofrece?" o "¿Quieres que compare ambas boutiques en algún aspecto concreto?".
- Responde en español, con un tono profesional pero cercano, como un compañero de equipo que conoce bien la organización.
- Usa formato markdown cuando mejore la legibilidad (listas, negritas, etc.), pero no lo fuerces si la respuesta es breve.
- No inventes datos, cifras ni información que no esté en el contenido. Si no tienes la información, di claramente que no aparece en el handbook. Nunca especules ni hagas suposiciones sobre datos que no tengas.

CONTENIDO DEL HANDBOOK (tier: ${tier}):

${handbookContent}`;

  // ── Call Claude API with streaming ──
  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    // Stream SSE response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }

            if (parsed.type === 'message_stop') {
              res.write('data: [DONE]\n\n');
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const remaining = buffer.split('\n');
      for (const line of remaining) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.end();
  }
}
