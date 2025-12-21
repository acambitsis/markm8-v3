-- Seed platform_settings singleton row
-- This is required for the Clerk webhook to read the signup bonus amount

INSERT INTO platform_settings (id, signup_bonus_amount, updated_at)
VALUES ('singleton', '1.00', NOW())
ON CONFLICT (id) DO NOTHING;
