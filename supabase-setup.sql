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
grant usage on schema public to anon, authenticated;
grant select on public.materials to anon, authenticated;
grant insert, delete on public.materials to authenticated;

drop policy if exists "Public can view study materials" on public.materials;
drop policy if exists "Site admin can add study materials" on public.materials;
drop policy if exists "Site admin can delete study materials" on public.materials;
drop policy if exists "Site admin can upload PDFs" on storage.objects;
drop policy if exists "Site admin can delete PDFs" on storage.objects;

create policy "Public can view study materials"
on public.materials for select to anon, authenticated using (true);

create policy "Site admin can add study materials"
on public.materials for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

create policy "Site admin can delete study materials"
on public.materials for delete to authenticated
using ((auth.jwt() ->> 'email') = 'limedevil7@gmail.com');

create policy "Site admin can upload PDFs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'elday7e7'
  and (auth.jwt() ->> 'email') = 'limedevil7@gmail.com'
  and lower(name) like '%.pdf'
);

create policy "Site admin can delete PDFs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'elday7e7'
  and (auth.jwt() ->> 'email') = 'limedevil7@gmail.com'
);
