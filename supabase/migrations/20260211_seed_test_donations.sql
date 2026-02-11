-- Seed test donations for development
-- This creates confirmed donations linked to existing cases

-- Insert test donations for the first case found
INSERT INTO public.donations (
  case_id,
  donor_name,
  donor_email,
  amount,
  months_pledged,
  payment_code,
  status,
  donation_type,
  total_handed_over,
  created_at
)
SELECT
  c.id as case_id,
  donor.name as donor_name,
  donor.email as donor_email,
  donor.amount as amount,
  donor.months as months_pledged,
  'TEST-' || substr(md5(random()::text), 1, 8) as payment_code,
  'confirmed' as status,
  donor.dtype as donation_type,
  0 as total_handed_over,
  now() - (donor.days_ago || ' days')::interval as created_at
FROM public.cases c
CROSS JOIN (
  VALUES
    ('أحمد محمد', 'ahmed@example.com', 5000, 3, 'monthly', 30),
    ('سارة علي', 'sara@example.com', 2700, 1, 'monthly', 15),
    ('محمود حسن', 'mahmoud@example.com', 10000, 6, 'custom', 7),
    ('فاطمة إبراهيم', 'fatima@example.com', 1500, 1, 'custom', 3)
) AS donor(name, email, amount, months, dtype, days_ago)
WHERE c.is_published = true
LIMIT 4;

-- If no published cases, insert for any case
INSERT INTO public.donations (
  case_id,
  donor_name,
  donor_email,
  amount,
  months_pledged,
  payment_code,
  status,
  donation_type,
  total_handed_over,
  created_at
)
SELECT
  c.id as case_id,
  donor.name as donor_name,
  donor.email as donor_email,
  donor.amount as amount,
  donor.months as months_pledged,
  'TEST-' || substr(md5(random()::text), 1, 8) as payment_code,
  'confirmed' as status,
  donor.dtype as donation_type,
  0 as total_handed_over,
  now() - (donor.days_ago || ' days')::interval as created_at
FROM public.cases c
CROSS JOIN (
  VALUES
    ('أحمد محمد', 'ahmed@example.com', 5000, 3, 'monthly', 30),
    ('سارة علي', 'sara@example.com', 2700, 1, 'monthly', 15),
    ('محمود حسن', 'mahmoud@example.com', 10000, 6, 'custom', 7),
    ('فاطمة إبراهيم', 'fatima@example.com', 1500, 1, 'custom', 3)
) AS donor(name, email, amount, months, dtype, days_ago)
WHERE NOT EXISTS (SELECT 1 FROM public.donations WHERE status = 'confirmed')
LIMIT 4;
