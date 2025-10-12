-- Lead Management System Database Schema
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

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    mobile VARCHAR(20),
    request TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Acquisition table
CREATE TABLE IF NOT EXISTS lead_acquisition (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    platform VARCHAR(100),
    campaign VARCHAR(255),
    ad_set VARCHAR(255),
    ad VARCHAR(255),
    landing_page_url TEXT,
    ipv4 VARCHAR(45),
    ipv6 VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lead Enriched Details table
CREATE TABLE IF NOT EXISTS lead_enriched_details (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    country VARCHAR(100),
    university VARCHAR(255),
    level VARCHAR(50),
    stream VARCHAR(255),
    subject VARCHAR(255),
    target_intake VARCHAR(50),
    current_pursuit VARCHAR(100)
);

-- Lead Process table
CREATE TABLE IF NOT EXISTS lead_process (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Demographic Profile table
CREATE TABLE IF NOT EXISTS demographic_profile (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    city_tier VARCHAR(50),
    family_income_range VARCHAR(100),
    source_of_income VARCHAR(255),
    will_take_edu_loan BOOLEAN
);

-- Academic Profile table
CREATE TABLE IF NOT EXISTS academic_profile (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    study_grade VARCHAR(50),
    school VARCHAR(255),
    school_board VARCHAR(100),
    college VARCHAR(255),
    university VARCHAR(255),
    study_stream VARCHAR(255),
    gpa VARCHAR(20),
    notes TEXT
);

-- Work Profile table
CREATE TABLE IF NOT EXISTS work_profile (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    working_at VARCHAR(255),
    industry VARCHAR(255),
    work_designation VARCHAR(255),
    years_of_experience INTEGER,
    notes TEXT
);

-- Standardized Test Scores table
CREATE TABLE IF NOT EXISTS standardized_test_scores (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    ielts_score DECIMAL(3, 1),
    pte_score INTEGER,
    toefl_score INTEGER,
    sat_score INTEGER,
    gre_score INTEGER,
    gmat_score INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_acquisition_platform ON lead_acquisition(platform);
CREATE INDEX IF NOT EXISTS idx_lead_process_stage ON lead_process(stage);
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

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_process_updated_at BEFORE UPDATE ON lead_process
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

