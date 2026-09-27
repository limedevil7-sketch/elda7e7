create extension if not exists pgcrypto;

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  name text not null,
  path text not null unique,
  url text not null,
  created timestamptz not null default now()
);

alter table public.materials enable row level security;

drop policy if exists "Public can view study materials" on public.materials;
create policy "Public can view study materials"
on public.materials for select to anon, authenticated using (true);

drop policy if exists "Site admin can add study material metadata" on public.materials;
create policy "Site admin can add study material metadata"
on public.materials for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

drop policy if exists "Site admin can delete study material metadata" on public.materials;
create policy "Site admin can delete study material metadata"
on public.materials for delete to authenticated
using ((auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

drop policy if exists "Public can view study material files" on storage.objects;
create policy "Public can view study material files"
on storage.objects for select to anon, authenticated
using (bucket_id = 'elday7e7');

drop policy if exists "Site admin can upload PDFs" on storage.objects;
create policy "Site admin can upload PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'elday7e7'
  and (auth.jwt() ->> 'email') = 'limedevil7@gmail.com'
  and lower(name) like '%.pdf'
);

drop policy if exists "Site admin can delete PDFs" on storage.objects;
create policy "Site admin can delete PDFs"
on storage.objects for delete to authenticated
using (bucket_id = 'elday7e7' and (auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

create table if not exists public.creator_messages (
  id uuid primary key default gen_random_uuid(),
  student_key text not null,
  student_name text not null check (char_length(student_name) between 1 and 80),
  body text not null check (char_length(body) between 1 and 2000),
  sender_is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.creator_messages add column if not exists student_key text;

alter table public.creator_messages enable row level security;
grant insert on public.creator_messages to anon, authenticated;
grant select on public.creator_messages to authenticated;

drop policy if exists "Students can send creator messages" on public.creator_messages;
create policy "Students can send creator messages"
on public.creator_messages for insert to anon, authenticated
with check (sender_is_admin = false and student_key is not null and char_length(student_key) = 36);

drop policy if exists "Site admin can read creator messages" on public.creator_messages;
create policy "Site admin can read creator messages"
on public.creator_messages for select to authenticated
using ((auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

drop policy if exists "Site admin can reply to creator messages" on public.creator_messages;
create policy "Site admin can reply to creator messages"
on public.creator_messages for insert to authenticated
with check (sender_is_admin = true and (auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

create or replace function public.get_student_creator_messages(p_student_key text)
returns setof public.creator_messages
language sql
security definer
set search_path = ''
as $$
  select * from public.creator_messages
  where student_key = p_student_key
    and char_length(p_student_key) = 36
  order by created_at asc
  limit 500;
$$;

revoke all on function public.get_student_creator_messages(text) from public;
grant execute on function public.get_student_creator_messages(text) to anon, authenticated;
notify pgrst, 'reload schema';
