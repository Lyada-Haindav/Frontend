 

export async function generateForm(prompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
  }

  const systemPrompt = `You are a form generation assistant. Generate a rich, multi-step form configuration based on the user's description.

Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "title": "Form Title",
  "description": "Form description",
  "steps": [
    {
      "title": "Step Title",
      "description": "Step description",
      "fields": [
        {
          "type": "text|email|tel|number|textarea|select|radio|checkbox|date",
          "label": "Field Label",
          "placeholder": "Placeholder text",
          "required": true|false,
          "options": ["option1", "option2"] // only for select/radio/checkbox
        }
      ]
    }
  ]
}

Guidelines:
- Always create 2-4 logical steps when possible
- Include 6-12 total fields across all steps
- Use a variety of field types (text, email, tel, number, textarea, select, radio, checkbox, date)
- Include helpful placeholders
- Mark important fields as required
- For select/radio/checkbox, provide 3-6 relevant options
- Prefer specific labels (e.g., "Company Name" over "Name")`;

  const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}\n\nGenerate the form configuration:`;

  let text: string;
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
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: 'json_object' as const },
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      const fallback = fallbackForm(prompt);
      return { formConfig: fallback };
    }
    const data = await resp.json();
    text = data?.choices?.[0]?.message?.content || '';
  } catch (err: unknown) {
    const fallback = fallbackForm(prompt);
    return { formConfig: fallback };
  }

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const formConfig = JSON.parse(jsonMatch[0]);
  return { formConfig };
}

function fallbackForm(prompt: string) {
  const p = prompt.toLowerCase();
  if (p.includes('blood') && p.includes('donation')) {
    return {
      title: 'Blood Donation Form',
      description: 'Collect donor details and medical screening information.',
      steps: [
        {
          title: 'Donor Information',
          description: 'Basic contact details',
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'Enter your full name', required: true },
            { type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
            { type: 'tel', label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: true },
            { type: 'date', label: 'Date of Birth', required: true }
          ]
        },
        {
          title: 'Eligibility',
          description: 'Medical screening',
          fields: [
            { type: 'select', label: 'Blood Type', options: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
            { type: 'checkbox', label: 'I am not currently ill', required: true },
            { type: 'checkbox', label: 'I have not donated blood in the last 3 months', required: true },
            { type: 'textarea', label: 'Medical Conditions', placeholder: 'List any relevant conditions', required: false }
          ]
        },
        {
          title: 'Consent',
          description: 'Review and agree',
          fields: [
            { type: 'checkbox', label: 'I consent to donate blood', required: true },
            { type: 'textarea', label: 'Additional Notes', placeholder: 'Anything else we should know?', required: false }
          ]
        }
      ]
    };
  }

  if (p.includes('contact') || p.includes('registration') || p.includes('signup')) {
    return {
      title: 'Registration Form',
      description: 'Basic details to get started',
      steps: [
        {
          title: 'Contact Details',
          fields: [
            { type: 'text', label: 'Full Name', placeholder: 'Jane Doe', required: true },
            { type: 'email', label: 'Work Email', placeholder: 'jane@company.com', required: true },
            { type: 'tel', label: 'Phone Number', placeholder: '+1 (555) 123-4567', required: false },
            { type: 'text', label: 'Company Name', placeholder: 'Acme Inc.', required: false }
          ]
        },
        {
          title: 'Additional Info',
          fields: [
            { type: 'select', label: 'Role', placeholder: 'Choose role', required: true, options: ['Founder','Manager','Engineer','Designer','Other'] },
            { type: 'radio', label: 'Team Size', required: true, options: ['1-10','11-50','51-200','200+'] },
            { type: 'date', label: 'Target Start Date', required: false },
            { type: 'textarea', label: 'Notes', placeholder: 'Tell us more about your needs', required: false }
          ]
        }
      ]
    };
  }

  return {
    title: 'Custom Form',
    description: 'Generated from your prompt',
    steps: [
      {
        title: 'Contact Details',
        fields: [
          { type: 'text', label: 'Full Name', placeholder: 'Your full name', required: true },
          { type: 'email', label: 'Email', placeholder: 'you@example.com', required: true },
          { type: 'tel', label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: false }
        ]
      },
      {
        title: 'Preferences',
        fields: [
          { type: 'select', label: 'Category', placeholder: 'Choose one', required: false, options: ['General', 'Support', 'Feedback'] },
          { type: 'radio', label: 'Priority', required: false, options: ['Low','Medium','High'] },
          { type: 'date', label: 'Preferred Date', required: false }
        ]
      },
      {
        title: 'Confirmation',
        fields: [
          { type: 'checkbox', label: 'I agree to the terms', required: true },
          { type: 'textarea', label: 'Additional Details', placeholder: 'Tell us more...', required: false }
        ]
      }
    ]
  };
}