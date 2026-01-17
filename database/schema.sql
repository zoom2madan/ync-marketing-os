-- Marketing OS Database Schema
-- All column names in snake_case

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CUSTOMERS ====================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    lms_lead_id VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_created_at TIMESTAMP WITH TIME ZONE,
    source_updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_lms_lead_id ON customers(lms_lead_id);

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CUSTOMER_ATTRIBUTES ====================
CREATE TABLE IF NOT EXISTS customer_attributes (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('numeric', 'string', 'date', 'timestamp', 'boolean', 'array')),
    field_name VARCHAR(100) NOT NULL,
    field_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_created_at TIMESTAMP WITH TIME ZONE,
    source_updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(customer_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_customer_attributes_customer_id ON customer_attributes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_attributes_field_name ON customer_attributes(field_name);

CREATE TRIGGER update_customer_attributes_updated_at BEFORE UPDATE ON customer_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== FUNNEL_EVENTS ====================
CREATE TABLE IF NOT EXISTS funnel_events (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    funnel_type VARCHAR(20) NOT NULL CHECK (funnel_type IN ('sales', 'service-delivery')),
    from_stage VARCHAR(100),
    to_stage VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_customer_id ON funnel_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel_type ON funnel_events(funnel_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events(created_at);

-- ==================== CUSTOMER_SEGMENTS ====================
CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('manual', 'sql', 'function')),
    selection_sql TEXT,
    handler_function VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(type);

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== CUSTOMER_SEGMENT_CUSTOMER_LIST ====================
CREATE TABLE IF NOT EXISTS customer_segment_customer_list (
    id SERIAL PRIMARY KEY,
    customer_segment_id INTEGER REFERENCES customer_segments(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_segment_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_segment_list_segment_id ON customer_segment_customer_list(customer_segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_list_customer_id ON customer_segment_customer_list(customer_id);

-- ==================== MESSAGE_TEMPLATES ====================
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'whatsapp')),
    templating_type VARCHAR(20) DEFAULT 'mjml',
    subject VARCHAR(500),
    message TEXT NOT NULL,
    from_email VARCHAR(500),  -- Sender email with name, e.g., "Name<email@domain.com>". For email type only.
    reply_to VARCHAR(255),    -- Reply-to email address. For email type only.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== AUTOMATIONS ====================
CREATE TABLE IF NOT EXISTS automations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    customer_segment_id INTEGER REFERENCES customer_segments(id),
    message_template_id INTEGER REFERENCES message_templates(id),
    cron VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automations_is_active ON automations(is_active);
CREATE INDEX IF NOT EXISTS idx_automations_segment_id ON automations(customer_segment_id);
CREATE INDEX IF NOT EXISTS idx_automations_template_id ON automations(message_template_id);

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== AUTOMATION_LOGS ====================
CREATE TABLE IF NOT EXISTS automation_logs (
    id SERIAL PRIMARY KEY,
    automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    customers_processed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_automation_id ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_started_at ON automation_logs(started_at);

-- ==================== AUTOMATION_TRACKER ====================
-- Tracks which customers have received emails from each automation
-- Prevents duplicate emails by ensuring each customer only receives one email per automation
CREATE TABLE IF NOT EXISTS automation_tracker (
    id SERIAL PRIMARY KEY,
    automation_id INTEGER REFERENCES automations(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    message_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(automation_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_automation_tracker_automation_id ON automation_tracker(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_tracker_customer_id ON automation_tracker(customer_id);
