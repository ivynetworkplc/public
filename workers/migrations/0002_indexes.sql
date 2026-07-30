-- Indexes for search, admin filters and performance

CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_department ON contact_messages(department);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscribers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partnership_status ON partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_partnership_created ON partnership_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partnership_email ON partnership_requests(email);

CREATE INDEX IF NOT EXISTS idx_support_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_created ON support_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_email ON support_requests(email);

CREATE INDEX IF NOT EXISTS idx_copyright_status ON copyright_reports(status);
CREATE INDEX IF NOT EXISTS idx_copyright_created ON copyright_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_copyright_email ON copyright_reports(email);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

CREATE INDEX IF NOT EXISTS idx_generic_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_generic_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_generic_created ON form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generic_email ON form_submissions(email);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_logs(event_type);
