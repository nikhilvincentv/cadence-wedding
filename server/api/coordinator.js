
import { Router } from 'express';
import { COORDINATOR_SYSTEM, coordinatorUser } from '../prompts.js';
import { chatJSON } from '../ai.js';
import { fullState } from '../data.js';

const coordinatorRouter = Router();

coordinatorRouter.post('/', async (req, res) => {
  const { message, data } = req.body;
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
      message,
    };

    const result = await chatJSON({
      system: COORDINATOR_SYSTEM,
      user: coordinatorUser(payload),
      temperature: 0.5,
      maxTokens: 2000,
    });

    res.json({ reply: result.reply });
  } catch (error) {
    console.error('Error in coordinator API:', error);
    res.status(500).json({ error: 'Failed to process coordinator request' });
  }
});

export default coordinatorRouter;
