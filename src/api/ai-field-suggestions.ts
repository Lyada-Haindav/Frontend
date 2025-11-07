 

export async function generateFieldSuggestions(prompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return fallbackGeneration(prompt);
  }


  const systemPrompt = `You are a form field generator AI. Based on the user's description, generate appropriate form fields.

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no explanations):
{
  "fields": [
    {
      "type": "text|email|number|tel|url|textarea|select|radio|checkbox|date",
      "label": "Field Label",
      "placeholder": "Placeholder text (optional)",
      "required": true,
      "options": ["option1", "option2"]
    }
  ]
}

Guidelines:
- Use appropriate field types (email for emails, tel for phone numbers, etc.)
- Generate realistic placeholders
- Set required based on field importance
- Include options array only for select, radio, or checkbox types
- Generate 3-8 relevant fields based on the prompt

User request: ${prompt}`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON when asked.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.2,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    
    const result_data = JSON.parse(cleanText);
    return result_data;
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);
    return fallbackGeneration(prompt);
  }
}

export async function getFieldSuggestions(context: { formTitle: string; formDescription: string; existingFields: any[] }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return fallbackSuggestions(context);
  }


  const systemPrompt = `You are a form builder AI assistant. Suggest 3-5 relevant fields for a form based on its context.

Form Title: ${context.formTitle}
Form Description: ${context.formDescription}
Existing Fields: ${context.existingFields.map(f => f.label).join(', ') || 'None'}

Return ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "type": "text|email|number|tel|textarea|select|radio|checkbox|date|time|file",
    "label": "Field Label",
    "placeholder": "Placeholder text",
    "required": false
  }
]`;

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON when asked.' },
          { role: 'user', content: systemPrompt }
        ],
        temperature: 0.2,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI HTTP ${resp.status}: ${errText}`);
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();
    
    const suggestions = JSON.parse(cleanText);
    return { suggestions };
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);
    return fallbackSuggestions(context);
  }
}

function fallbackGeneration(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const fields = [];
  
  if (lowerPrompt.includes('contact') || lowerPrompt.includes('email')) {
    fields.push(
      { type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true },
      { type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true },
      { type: 'tel', label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: false }
    );
  } else if (lowerPrompt.includes('survey') || lowerPrompt.includes('feedback')) {
    fields.push(
      { type: 'text', label: 'Name', placeholder: 'Your name', required: true },
      { type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
      { type: 'select', label: 'Rating', options: ['Excellent', 'Good', 'Average', 'Poor'], required: true },
      { type: 'textarea', label: 'Comments', placeholder: 'Share your feedback...', required: false }
    );
  } else if (lowerPrompt.includes('registration') || lowerPrompt.includes('signup')) {
    fields.push(
      { type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true },
      { type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
      { type: 'tel', label: 'Phone', placeholder: '+1 (555) 000-0000', required: false },
      { type: 'date', label: 'Date of Birth', required: false }
    );
  } else {
    fields.push(
      { type: 'text', label: 'Name', placeholder: 'Enter your name', required: true },
      { type: 'email', label: 'Email', placeholder: 'your@email.com', required: true },
      { type: 'textarea', label: 'Message', placeholder: 'Enter your message', required: false }
    );
  }
  
  return { fields };
}

function fallbackSuggestions(context: any) {
  const suggestions = [
    { type: 'text', label: 'Additional Info', placeholder: 'Enter details', required: false },
    { type: 'select', label: 'Category', options: ['Option 1', 'Option 2', 'Option 3'], required: false },
    { type: 'date', label: 'Date', placeholder: 'Select date', required: false }
  ];
  
  return { suggestions };
}