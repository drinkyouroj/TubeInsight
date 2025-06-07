-- Track admin actions for auditing
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track API usage for cost management
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    api_name VARCHAR(50) NOT NULL, -- 'openai' or 'youtube'
    endpoint VARCHAR(100) NOT NULL,
    tokens_used INTEGER, -- For OpenAI
    cost_estimate NUMERIC(10, 6), -- Estimated cost in USD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limits configuration
CREATE TABLE IF NOT EXISTS user_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    daily_analysis_limit INTEGER DEFAULT 10,
    openai_token_limit INTEGER DEFAULT 100000,
    youtube_request_limit INTEGER DEFAULT 50,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);