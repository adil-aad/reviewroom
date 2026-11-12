-- The same starter examples as src/app/projects/data.ts.
-- Old timestamps keep newly created projects ahead of the examples.
INSERT INTO projects (id, name, client, status, description, created_at)
VALUES
  (
    'brand-identity', 'Brand identity', 'Maji Studio', 'Awaiting feedback',
    'Logo, color palette, and typography for Maji Studio''s new identity.',
    '2000-01-01T00:00:00Z'
  ),
  (
    'website-homepage', 'Website homepage', 'Northline', 'Approved',
    'A homepage concept introducing Northline''s services and guiding visitors to get in touch.',
    '2000-01-01T00:00:00Z'
  )
ON CONFLICT (id) DO NOTHING
RETURNING id;
