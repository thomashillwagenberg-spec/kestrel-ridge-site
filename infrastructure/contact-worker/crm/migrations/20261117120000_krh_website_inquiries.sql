-- KRH website inquiries: insert-only intake table for the contact Worker.
--
-- STATUS: NOT APPLIED. Written for review on branch feat/inquiry-crm.
-- Target: KRH Atomic CRM (Supabase Postgres, ~/atomic-crm). To apply, the
-- owner copies this file into ~/atomic-crm/supabase/migrations/ and runs it
-- through the normal Supabase migration flow after approval.
--
-- What it does:
--   1. Creates public.website_inquiries, a minimal intake table. No PHI
--      columns. The free-text message is NOT stored, only its SHA-256.
--   2. Enforces dedup with UNIQUE (idempotency_key) and UNIQUE (inquiry_id).
--      The Worker does a plain INSERT; a retry of the same submission hits
--      the unique constraint (SQLSTATE 23505, PostgREST HTTP 409), which the
--      Worker treats as "already recorded". No duplicate rows are possible.
--   3. Creates role krh_inquiry_writer (NOLOGIN). It may only INSERT the
--      intake columns. No SELECT, UPDATE, DELETE, and no access to any other
--      CRM table. The Worker secret CRM_SERVICE_KEY is a JWT whose role
--      claim is krh_inquiry_writer (see crm/README.md). It is NOT the
--      Supabase service_role key.
--   4. Lets signed-in CRM users (authenticated) read the intake rows and
--      set contact_id / reconciled_at when linking an inquiry to a contact.
--
-- Rollback: drop table public.website_inquiries; drop role krh_inquiry_writer;

begin;

create table if not exists public.website_inquiries (
    id               bigint generated always as identity primary key,
    inquiry_id       text not null,
    idempotency_key  text not null,
    received_at      timestamptz not null,
    recorded_at      timestamptz not null default now(),
    form_type        text not null default 'contact',
    contact_name     text not null,
    organization     text,
    email            text not null,
    message_sha256   text not null,
    source           text not null default 'website_contact_worker',
    contact_id       bigint references public.contacts(id) on delete set null,
    reconciled_at    timestamptz,
    constraint website_inquiries_inquiry_id_key unique (inquiry_id),
    constraint website_inquiries_idempotency_key_key unique (idempotency_key),
    constraint website_inquiries_inquiry_id_format
        check (inquiry_id ~ '^KRH-INQ-[0-9]{8}-[A-Z2-7]{10}$'),
    constraint website_inquiries_idempotency_key_format
        check (idempotency_key ~ '^[0-9a-f]{64}$'),
    constraint website_inquiries_message_sha256_format
        check (message_sha256 ~ '^[0-9a-f]{64}$'),
    constraint website_inquiries_form_type check (form_type in ('contact')),
    constraint website_inquiries_source check (source = 'website_contact_worker'),
    constraint website_inquiries_name_len
        check (char_length(contact_name) between 1 and 120),
    constraint website_inquiries_org_len
        check (organization is null or char_length(organization) <= 120),
    constraint website_inquiries_email_shape
        check (char_length(email) <= 254 and email = lower(email) and position('@' in email) > 1)
);

comment on table public.website_inquiries is
    'Website contact-form intake written by the KRH contact Worker (insert-only role krh_inquiry_writer). No PHI; message body is not stored, only message_sha256. Full message lives in the notification email, matched by inquiry_id.';

create index if not exists website_inquiries_unreconciled_idx
    on public.website_inquiries (received_at)
    where reconciled_at is null;

-- Insert-only role used by the Worker through PostgREST.
do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'krh_inquiry_writer') then
        create role krh_inquiry_writer nologin noinherit;
    end if;
end
$$;

-- PostgREST switches from authenticator to the JWT role claim.
grant krh_inquiry_writer to authenticator;

grant usage on schema public to krh_inquiry_writer;
revoke all on public.website_inquiries from public, anon, krh_inquiry_writer;
grant insert (inquiry_id, idempotency_key, received_at, form_type,
              contact_name, organization, email, message_sha256, source)
    on public.website_inquiries to krh_inquiry_writer;
-- Deliberately NO select grant. ON CONFLICT would need SELECT on the arbiter
-- column plus a SELECT RLS policy, so the Worker uses a plain INSERT and
-- treats the unique violation (SQLSTATE 23505, PostgREST HTTP 409) as
-- "already recorded".

alter table public.website_inquiries enable row level security;

drop policy if exists website_inquiries_worker_insert on public.website_inquiries;
create policy website_inquiries_worker_insert
    on public.website_inquiries
    for insert
    to krh_inquiry_writer
    with check (contact_id is null and reconciled_at is null);

-- CRM users: read intake rows and record reconciliation only.
revoke all on public.website_inquiries from authenticated;
grant select on public.website_inquiries to authenticated;
grant update (contact_id, reconciled_at) on public.website_inquiries to authenticated;

drop policy if exists website_inquiries_crm_read on public.website_inquiries;
create policy website_inquiries_crm_read
    on public.website_inquiries
    for select
    to authenticated
    using (true);

drop policy if exists website_inquiries_crm_reconcile on public.website_inquiries;
create policy website_inquiries_crm_reconcile
    on public.website_inquiries
    for update
    to authenticated
    using (true)
    with check (true);

commit;
