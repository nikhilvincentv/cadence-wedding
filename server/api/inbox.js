
import { Router } from 'express';
import { INBOX_SYSTEM, inboxUser } from '../prompts.js';
import { chatJSON } from '../ai.js';
import { fullState } from '../data.js';

const inboxRouter = Router();

inboxRouter.post('/process', async (req, res) => {
  const { thread, data } = req.body;
  const userId = req.headers['x-user-id'];

  try {
    const { wedding, vendors, timeline, budgetCategories, guests, payments } = data || fullState();

    const payload = {
      wedding,
      vendors,
      timeline,
      budgetCategories,
      guests,
      payments,
      thread,
    };

    const result = await chatJSON({
      system: INBOX_SYSTEM,
      user: inboxUser(payload),
      temperature: 0.5,
      maxTokens: 2000,
    });

    res.json({ tldr: result.tldr, impact: result.impact, impactLevel: result.impactLevel });
  } catch (error) {
    console.error('Error in inbox process API:', error);
    res.status(500).json({ error: 'Failed to process inbox request' });
  }
});

export default inboxRouter;
