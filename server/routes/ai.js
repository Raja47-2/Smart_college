import express from 'express';
import authenticateToken from '../middleware/auth.js';
import db from '../database.js';

const router = express.Router();

// Store conversation history (in production, use database)
const conversationHistory = {};

// AI Response generator (basic implementation - can be enhanced with actual AI API)
function generateAIResponse(question, category, context, db) {
  // This is a basic implementation. In production, integrate with:
  // - OpenAI API, Google APIs, or other AI services
  // - Database for learning resources
  
  const responses = {
    general: {
      keywords: ['how', 'what', 'why', 'explain', 'help'],
      responses: [
        "That's a great question! Let me break it down for you...",
        "I'd be happy to help you understand this better. Here's what I know...",
        "This is an important topic. Let me provide you with a comprehensive answer..."
      ]
    },
    subject: {
      keywords: ['math', 'science', 'english', 'history', 'chemistry', 'physics', 'biology'],
      responses: [
        "In the context of this subject, the key points are...",
        "This is a fundamental concept in this field. Here's the explanation...",
        "Based on the curriculum, here's what you need to know..."
      ]
    },
    assignment: {
      keywords: ['assignment', 'project', 'task', 'problem', 'solve'],
      responses: [
        "Here's a step-by-step approach to tackle this assignment...",
        "For this assignment, focus on these key aspects...",
        "Here's a helpful framework for completing this task..."
      ]
    },
    concept: {
      keywords: ['concept', 'definition', 'meaning', 'understand', 'clarify'],
      responses: [
        "Let me clarify this concept for you with a clear definition and examples...",
        "This concept might seem complex, but here's a simple way to understand it...",
        "The core idea behind this concept is..."
      ]
    },
    exam: {
      keywords: ['exam', 'test', 'prepare', 'study', 'revision'],
      responses: [
        "For exam preparation, here are the essential points you should focus on...",
        "These are high-probability questions for your exam...",
        "Here's a revision strategy that works well for this topic..."
      ]
    },
    career: {
      keywords: ['career', 'job', 'future', 'course', 'subject'],
      responses: [
        "This career path offers excellent opportunities. Here's my guidance...",
        "Based on your interests, these courses would be beneficial...",
        "The current job market shows strong demand for these skills..."
      ]
    }
  };

  const selectedCategory = responses[category] || responses.general;
  const randomResponse = selectedCategory.responses[
    Math.floor(Math.random() * selectedCategory.responses.length)
  ];

  // Enhanced response with detailed information
  let detailedResponse = `${randomResponse}\n\n`;

  if (question.toLowerCase().includes('derivative')) {
    detailedResponse += `Derivatives measure the rate of change of a function. 

Key concepts:
• The derivative f'(x) represents the slope of the tangent line at point x
• It shows how quickly a function's value changes with respect to changes in x
• Common rules: Power rule (d/dx x^n = nx^(n-1)), Product rule, Chain rule, Quotient rule

Applications:
• Finding maximum and minimum values
• Calculating velocity and acceleration in physics
• Optimization problems in engineering and economics

Practice tip: Start with simple functions and use the definition before applying shortcut rules.`;
  } else if (question.toLowerCase().includes('photosynthesis')) {
    detailedResponse += `Photosynthesis is the process by which plants convert light energy into chemical energy.

The process occurs in two main stages:

1. Light-dependent reactions (Thylakoid):
   • Occurs in daylight
   • Chlorophyll absorbs light energy
   • Water molecules are split (photolysis)
   • Produces ATP and NADPH

2. Light-independent reactions/Calvin Cycle (Stroma):
   • Does not directly need light
   • Uses ATP and NADPH from reactions 1
   • Converts CO2 into glucose
   • Produces G3P and glucose

Overall equation: 6CO2 + 6H2O + Light → C6H12O6 + 6O2

Key importance:
• Produces oxygen we breathe
• Creates glucose for plant growth and energy
• Foundation of most food chains`;
  } else if (question.toLowerCase().includes('study') || question.toLowerCase().includes('tips')) {
    detailedResponse += `Here are proven study techniques:

Effective methods:
• Pomodoro Technique: 25 min focused study + 5 min break
• Active Recall: Test yourself instead of just reading
• Spaced Repetition: Review material at increasing intervals
• Mind Mapping: Visualize concepts and connections

Study environment:
• Choose a quiet, distraction-free space
• Keep phone away or in airplane mode
• Ensure adequate lighting and comfortable seating
• Maintain consistent study schedule

Additional tips:
• Explain concepts to someone else
• Create summary notes
• Practice with past papers
• Join study groups
• Get adequate sleep (crucial for memory consolidation)`;
  } else {
    detailedResponse += `I'll help you explore this topic further. Consider:

1. Breaking down the question into smaller parts
2. Identifying what you already know
3. Looking for related concepts
4. Seeking patterns or examples

Would you like me to:
• Explain specific terminology?
• Provide relevant examples?
• List key resources?
• Help with practice problems?

Remember: Learning is a journey. It's fine to not understand everything immediately!`;
  }

  return {
    response: detailedResponse,
    sources: ['Academic Database', 'Curriculum Materials', 'Study Resources'],
    category: category
  };
}

// Ask doubt endpoint
router.post('/ask-doubt', authenticateToken, async (req, res) => {
  try {
    const { question, category, userType, context } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }

    // Generate AI response
    const aiResponse = generateAIResponse(question, category, context, db);

    // Store in database for history
    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO ai_doubts (user_id, question, category, response, user_type, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, question, category, aiResponse.response, userType, timestamp],
      (err) => {
        if (err) console.error('Error storing doubt:', err);
      }
    );

    // Store conversation in memory
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }
    conversationHistory[userId].push({
      question,
      response: aiResponse.response,
      category,
      timestamp
    });

    res.json(aiResponse);
  } catch (error) {
    console.error('Error in AI assistant:', error);
    res.status(500).json({ 
      error: 'Failed to process your question',
      response: 'Please try again later.' 
    });
  }
});

// Get doubt history
router.get('/doubt-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    db.all(
      `SELECT * FROM ai_doubts WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50`,
      [userId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch history' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get AI stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    db.get(
      `SELECT 
        COUNT(*) as total_doubts,
        COUNT(DISTINCT category) as categories_explored
       FROM ai_doubts WHERE user_id = ?`,
      [userId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }
        res.json({
          total_doubts: row?.total_doubts || 0,
          categories_explored: row?.categories_explored || 0
        });
      }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
