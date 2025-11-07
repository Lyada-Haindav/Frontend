-- Create templates table for pre-built form templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create forms table
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.templates(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create steps table
CREATE TABLE public.steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fields table
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.steps(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  default_value TEXT,
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  validation_rules JSONB,
  conditional_logic JSONB,
  options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Templates policies (public read)
CREATE POLICY "Templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (true);

-- Forms policies
CREATE POLICY "Users can view their own forms"
  ON public.forms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own forms"
  ON public.forms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms"
  ON public.forms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms"
  ON public.forms FOR DELETE
  USING (auth.uid() = user_id);

-- Steps policies
CREATE POLICY "Users can view steps of their forms"
  ON public.steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can create steps in their forms"
  ON public.steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can update steps in their forms"
  ON public.steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete steps from their forms"
  ON public.steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = steps.form_id AND forms.user_id = auth.uid()
  ));

-- Fields policies
CREATE POLICY "Users can view fields of their forms"
  ON public.fields FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.steps
    JOIN public.forms ON forms.id = steps.form_id
    WHERE steps.id = fields.step_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can create fields in their forms"
  ON public.fields FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.steps
    JOIN public.forms ON forms.id = steps.form_id
    WHERE steps.id = fields.step_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can update fields in their forms"
  ON public.fields FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.steps
    JOIN public.forms ON forms.id = steps.form_id
    WHERE steps.id = fields.step_id AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete fields from their forms"
  ON public.fields FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.steps
    JOIN public.forms ON forms.id = steps.form_id
    WHERE steps.id = fields.step_id AND forms.user_id = auth.uid()
  ));

-- Submissions policies
CREATE POLICY "Anyone can submit to published forms"
  ON public.submissions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = submissions.form_id AND forms.is_published = true
  ));

CREATE POLICY "Form owners can view their submissions"
  ON public.submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.forms
    WHERE forms.id = submissions.form_id AND forms.user_id = auth.uid()
  ));

-- Insert default templates
INSERT INTO public.templates (name, description, icon, category, config) VALUES
('Contact Form', 'Simple contact form with name, email, and message', 'Mail', 'General', 
 '{"steps":[{"title":"Contact Information","fields":[{"type":"text","label":"Full Name","required":true},{"type":"email","label":"Email Address","required":true},{"type":"textarea","label":"Message","required":true}]}]}'::jsonb),
('Survey Form', 'Multi-step survey with various question types', 'ClipboardList', 'Survey',
 '{"steps":[{"title":"Personal Info","fields":[{"type":"text","label":"Name","required":true},{"type":"email","label":"Email","required":true}]},{"title":"Feedback","fields":[{"type":"radio","label":"How satisfied are you?","options":["Very Satisfied","Satisfied","Neutral","Dissatisfied"],"required":true},{"type":"textarea","label":"Additional Comments"}]}]}'::jsonb),
('Registration Form', 'Event or service registration', 'UserPlus', 'Registration',
 '{"steps":[{"title":"Basic Info","fields":[{"type":"text","label":"First Name","required":true},{"type":"text","label":"Last Name","required":true},{"type":"email","label":"Email","required":true}]},{"title":"Additional Details","fields":[{"type":"text","label":"Phone Number"},{"type":"select","label":"Preferred Time","options":["Morning","Afternoon","Evening"]}]}]}'::jsonb),
('Feedback Form', 'Product or service feedback collection', 'MessageSquare', 'Feedback',
 '{"steps":[{"title":"Your Experience","fields":[{"type":"radio","label":"Overall Rating","options":["Excellent","Good","Fair","Poor"],"required":true},{"type":"checkbox","label":"What did you like?","options":["Quality","Price","Service","Delivery"]},{"type":"textarea","label":"Tell us more"}]}]}'::jsonb);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add trigger to forms table
CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();