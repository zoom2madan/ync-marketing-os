-- Migration: Add from_email and reply_to fields to message_templates
-- These fields allow configuring sender email and reply-to address per template
-- for email type templates.

-- from_email: Contains name + email format, e.g., "Saurabh Tandon<hello@notifications.yournextcampus.com>"
-- reply_to: Contains only the email address for replies

ALTER TABLE message_templates 
ADD COLUMN IF NOT EXISTS from_email VARCHAR(500),
ADD COLUMN IF NOT EXISTS reply_to VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN message_templates.from_email IS 'Sender email with name, e.g., "Name<email@domain.com>". Used for email type templates only.';
COMMENT ON COLUMN message_templates.reply_to IS 'Reply-to email address. Used for email type templates only.';

