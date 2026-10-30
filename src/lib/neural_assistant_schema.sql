-- 🧠 Neural Personal Assistant Database Schema
-- The ChatGPT Killer System with Premium Tiers & Phone Integration

-- Neural notifications table
CREATE TABLE IF NOT EXISTS neural_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('morning_briefing', 'task_reminder', 'calendar_alert', 'email_summary', 'pattern_suggestion', 'proactive_help')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title text NOT NULL,
  message text NOT NULL,
  actionable boolean DEFAULT false,
  actions jsonb DEFAULT '[]'::jsonb,
  context jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Behavior patterns table - Neural Learning
CREATE TABLE IF NOT EXISTS behavior_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type text NOT NULL CHECK (pattern_type IN ('morning_routine', 'work_session', 'email_handling', 'task_prioritization', 'break_timing')),
  time_of_day text NOT NULL,
  frequency integer DEFAULT 1,
  triggers text[] DEFAULT '{}',
  actions text[] DEFAULT '{}',
  context jsonb DEFAULT '{}'::jsonb,
  confidence decimal(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Conversation memory - Like Human Memory System
CREATE TABLE IF NOT EXISTS conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  user_input text NOT NULL,
  assistant_response text NOT NULL,
  emotion text DEFAULT 'neutral',
  satisfaction integer CHECK (satisfaction >= 0 AND satisfaction <= 10),
  context text[] DEFAULT '{}',
  actions_triggered text[] DEFAULT '{}',
  learning_points text[] DEFAULT '{}',
  tier text NOT NULL CHECK (tier IN ('free', 'premium', 'enterprise')),
  created_at timestamptz DEFAULT now()
);

-- User premium tiers & usage tracking
CREATE TABLE IF NOT EXISTS user_premium_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'enterprise')),
  conversations_today integer DEFAULT 0,
  actions_this_month integer DEFAULT 0,
  voice_enabled boolean DEFAULT false,
  phone_sync_enabled boolean DEFAULT false,
  neural_learning_enabled boolean DEFAULT false,
  memory_retention_days integer DEFAULT 1, -- -1 for unlimited
  personality_customization_enabled boolean DEFAULT false,
  last_reset_date date DEFAULT current_date,
  subscription_start timestamptz,
  subscription_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phone integration & device sync
CREATE TABLE IF NOT EXISTS device_sync_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  push_token text,
  sync_enabled boolean DEFAULT true,
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  UNIQUE(user_id, device_id)
);

-- Voice personality settings
CREATE TABLE IF NOT EXISTS voice_personalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_id text NOT NULL DEFAULT 'neural_assistant_default',
  name text NOT NULL DEFAULT 'Your Assistant',
  gender text DEFAULT 'neutral' CHECK (gender IN ('male', 'female', 'neutral')),
  accent text DEFAULT 'american',
  emotional_range integer DEFAULT 5 CHECK (emotional_range >= 0 AND emotional_range <= 10),
  speaking_speed decimal(2,1) DEFAULT 1.0 CHECK (speaking_speed >= 0.5 AND speaking_speed <= 2.0),
  pitch decimal(2,1) DEFAULT 1.0 CHECK (pitch >= 0.5 AND pitch <= 2.0),
  warmth integer DEFAULT 7 CHECK (warmth >= 0 AND warmth <= 10),
  conversational_style text DEFAULT 'friendly' CHECK (conversational_style IN ('casual', 'professional', 'friendly', 'formal')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Neural learning clusters - Long-term memory
CREATE TABLE IF NOT EXISTS memory_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  facts text[] DEFAULT '{}',
  patterns text[] DEFAULT '{}',
  frequency integer DEFAULT 1,
  last_accessed timestamptz DEFAULT now(),
  confidence decimal(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  cluster_type text DEFAULT 'general' CHECK (cluster_type IN ('work', 'personal', 'preferences', 'skills', 'general')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phone integration preferences
CREATE TABLE IF NOT EXISTS phone_integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  voice_wake_word text DEFAULT 'Hey Assistant',
  offline_sync boolean DEFAULT false,
  cross_device_memory boolean DEFAULT true,
  real_time_sync boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{
    "morning": true,
    "workHours": true,
    "evening": false,
    "urgent": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usage analytics for monetization
CREATE TABLE IF NOT EXISTS neural_usage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('free', 'premium', 'enterprise')),
  conversations_count integer DEFAULT 0,
  voice_interactions integer DEFAULT 0,
  actions_executed integer DEFAULT 0,
  features_used text[] DEFAULT '{}',
  session_duration_minutes integer DEFAULT 0,
  upgrade_prompts_shown integer DEFAULT 0,
  upgrade_clicked boolean DEFAULT false,
  date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_neural_notifications_user_id ON neural_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_neural_notifications_created_at ON neural_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user_id ON behavior_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_patterns_pattern_type ON behavior_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_session_id ON conversation_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_device_sync_tokens_user_id ON device_sync_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_user_id ON memory_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_clusters_topic ON memory_clusters(topic);
CREATE INDEX IF NOT EXISTS idx_neural_usage_analytics_user_id ON neural_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_neural_usage_analytics_date ON neural_usage_analytics(date);

-- Row Level Security (RLS)
ALTER TABLE neural_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_premium_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_sync_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neural_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own neural notifications" ON neural_notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own neural notifications" ON neural_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own neural notifications" ON neural_notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own neural notifications" ON neural_notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own behavior patterns" ON behavior_patterns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own behavior patterns" ON behavior_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own behavior patterns" ON behavior_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation memory" ON conversation_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversation memory" ON conversation_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own premium tier" ON user_premium_tiers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own premium tier" ON user_premium_tiers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own premium tier" ON user_premium_tiers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own device tokens" ON device_sync_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own device tokens" ON device_sync_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own device tokens" ON device_sync_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own device tokens" ON device_sync_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own voice personalities" ON voice_personalities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own voice personalities" ON voice_personalities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own voice personalities" ON voice_personalities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own memory clusters" ON memory_clusters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory clusters" ON memory_clusters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory clusters" ON memory_clusters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own phone settings" ON phone_integration_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own phone settings" ON phone_integration_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own phone settings" ON phone_integration_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage analytics" ON neural_usage_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage analytics" ON neural_usage_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic tier management
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_premium_tiers 
  SET conversations_today = 0, 
      last_reset_date = current_date
  WHERE last_reset_date < current_date;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_premium_tiers 
  SET actions_this_month = 0
  WHERE date_trunc('month', last_reset_date) < date_trunc('month', current_date);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
CREATE TRIGGER update_neural_notifications_updated_at BEFORE UPDATE ON neural_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_behavior_patterns_updated_at BEFORE UPDATE ON behavior_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_premium_tiers_updated_at BEFORE UPDATE ON user_premium_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_voice_personalities_updated_at BEFORE UPDATE ON voice_personalities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memory_clusters_updated_at BEFORE UPDATE ON memory_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_phone_integration_settings_updated_at BEFORE UPDATE ON phone_integration_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial data - Default settings for new users
INSERT INTO user_premium_tiers (user_id, tier) 
SELECT id, 'free' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_premium_tiers)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO voice_personalities (user_id) 
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM voice_personalities)
ON CONFLICT DO NOTHING;

INSERT INTO phone_integration_settings (user_id) 
SELECT id 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM phone_integration_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;