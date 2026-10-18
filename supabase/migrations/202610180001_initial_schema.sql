-- RaktaRun application records. Each domain table keeps its existing JSON
-- document shape in payload while using a stable primary key for CRUD.
create table if not exists public.users (
  record_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.hospitals (like public.users including all);
create table if not exists public.donors (like public.users including all);
create table if not exists public.blood_requests (like public.users including all);
create table if not exists public.matches (like public.users including all);
create table if not exists public.audit_logs (like public.users including all);
create table if not exists public.buddy_links (like public.users including all);
create table if not exists public.buddy_referrals (like public.users including all);
create table if not exists public.email_verifications (like public.users including all);
create table if not exists public.blocked_emails (like public.users including all);
create table if not exists public.system_config (
  record_key text primary key default 'default',
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists users_payload_uid_idx on public.users ((payload->>'uid'));
create index if not exists users_payload_email_idx on public.users ((payload->>'email'));
create index if not exists hospitals_payload_uid_idx on public.hospitals ((payload->>'uid'));
create index if not exists donors_payload_uid_idx on public.donors ((payload->>'uid'));
create index if not exists blood_requests_payload_hospital_id_idx on public.blood_requests ((payload->>'hospitalId'));
create index if not exists matches_payload_request_id_idx on public.matches ((payload->>'requestId'));
create index if not exists matches_payload_donor_id_idx on public.matches ((payload->>'donorId'));
create index if not exists buddy_links_payload_token_idx on public.buddy_links ((payload->>'token'));
create index if not exists buddy_referrals_payload_request_id_idx on public.buddy_referrals ((payload->>'requestId'));
create index if not exists email_verifications_payload_email_idx on public.email_verifications ((payload->>'email'));

-- The service role is the only application access path. Do not add public
-- policies: the server verifies Firebase identity and enforces authorization.
alter table public.users enable row level security;
alter table public.hospitals enable row level security;
alter table public.donors enable row level security;
alter table public.blood_requests enable row level security;
alter table public.matches enable row level security;
alter table public.audit_logs enable row level security;
alter table public.buddy_links enable row level security;
alter table public.buddy_referrals enable row level security;
alter table public.email_verifications enable row level security;
alter table public.blocked_emails enable row level security;
alter table public.system_config enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donor-certificates',
  'donor-certificates',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
