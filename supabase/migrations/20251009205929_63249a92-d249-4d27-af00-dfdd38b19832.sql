-- Create shopping_history table to track past shopping sessions
CREATE TABLE IF NOT EXISTS public.shopping_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  stores_used TEXT[] NOT NULL DEFAULT '{}',
  total_items INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_savings NUMERIC(10,2) NOT NULL DEFAULT 0,
  completion_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_preferences table to store learned shopping preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  preferred_stores JSONB DEFAULT '{}',
  preferred_brands JSONB DEFAULT '{}',
  substitution_tolerance TEXT DEFAULT 'moderate' CHECK (substitution_tolerance IN ('strict', 'moderate', 'flexible')),
  max_price_variance NUMERIC(5,2) DEFAULT 0.15,
  budget_priority BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create substitution_rules table for smart substitution logic
CREATE TABLE IF NOT EXISTS public.substitution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_item TEXT NOT NULL,
  acceptable_substitutes JSONB[] DEFAULT '{}',
  never_substitute TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, original_item)
);

-- Create agent_decisions table for audit trail
CREATE TABLE IF NOT EXISTS public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_session_id UUID REFERENCES public.shopping_history(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  original_plan JSONB,
  final_decision JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.shopping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shopping_history
CREATE POLICY "Users can view their own shopping history"
  ON public.shopping_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping history"
  ON public.shopping_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for substitution_rules
CREATE POLICY "Users can manage their own substitution rules"
  ON public.substitution_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for agent_decisions
CREATE POLICY "Users can view decisions from their shopping sessions"
  ON public.agent_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_history
      WHERE shopping_history.id = agent_decisions.shopping_session_id
      AND shopping_history.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert agent decisions"
  ON public.agent_decisions FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_shopping_history_user_id ON public.shopping_history(user_id);
CREATE INDEX idx_shopping_history_session_date ON public.shopping_history(session_date DESC);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_substitution_rules_user_id ON public.substitution_rules(user_id);
CREATE INDEX idx_agent_decisions_session_id ON public.agent_decisions(shopping_session_id);

-- Add trigger to update user_preferences updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();