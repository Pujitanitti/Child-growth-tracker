const Anthropic = require('@anthropic-ai/sdk');
const Child = require('../models/Child');
const GrowthRecord = require('../models/GrowthRecord');
const { findOwnedChild } = require('./childController');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * SAFETY NOTE: this assistant is scoped to general, non-diagnostic parenting
 * information only. It must never diagnose, name a condition, recommend a
 * medication or dosage, or tell a parent a symptom is/isn't serious — that
 * determination requires an actual clinician who can examine the child.
 * Its one job for anything concerning is to say so plainly and point the
 * parent to their pediatrician or emergency services.
 */
function buildSystemPrompt(child, latestRecord) {
  const ageMonths = child.ageInMonths;
  return `You are a warm, knowledgeable parenting assistant inside a child growth tracking app, helping a parent understand general child development topics for their child, ${child.name} (${ageMonths} months old, ${child.gender}).

${latestRecord ? `Most recent measurement on file: height ${latestRecord.heightCm}cm, weight ${latestRecord.weightKg}kg, recorded ${new Date(latestRecord.date).toDateString()}.` : 'No growth measurements are on file yet.'}
${child.allergies?.length ? `Known allergies: ${child.allergies.join(', ')}.` : ''}
${child.medicalConditions?.length ? `Known medical conditions: ${child.medicalConditions.join(', ')}.` : ''}

Ground rules, no exceptions:
- Never diagnose a condition, never say a symptom "is" or "isn't" serious, and never recommend a specific medication, dosage, or treatment. Those require a clinician who can actually examine the child.
- For anything that sounds like a symptom, injury, fever, breathing difficulty, allergic reaction, or anything urgent: say plainly that this needs a pediatrician or emergency care, and stop there — don't speculate about causes or severity.
- You CAN give general, well-established parenting information: typical developmental ranges, general nutrition/sleep guidance, what growth percentiles mean, how vaccination schedules generally work, general milestone context.
- Always gently note that you're not a substitute for their pediatrician, especially before giving any general guidance.
- Keep answers concise, warm, and practical — a few short paragraphs at most, not an exhaustive essay.
- If asked about anything outside child health/development/parenting, politely redirect back to the app's purpose.`;
}

// POST /api/children/:childId/assistant/ask   { message: string }
const askAssistant = asyncHandler(async (req, res) => {
  const anthropic = getClient();
  if (!anthropic) {
    throw new AppError(
      'The AI Health Assistant is not configured on this server. Set ANTHROPIC_API_KEY in backend/.env to enable it.',
      503
    );
  }

  req.params.id = req.params.childId;
  const child = await findOwnedChild(req);
  const { message } = req.body;
  if (!message || !message.trim()) throw new AppError('Message is required', 400);

  const latestRecord = await GrowthRecord.findOne({ child: child._id }).sort({ date: -1 });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: buildSystemPrompt(child, latestRecord),
    messages: [{ role: 'user', content: message.trim() }],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  res.json({ success: true, data: { reply: text } });
});

// GET /api/assistant/status — lets the frontend know whether to show the chat widget at all
const getAssistantStatus = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { available: Boolean(getClient()) } });
});

module.exports = { askAssistant, getAssistantStatus };
