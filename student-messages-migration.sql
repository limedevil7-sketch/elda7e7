-- Run once in the Supabase project's SQL Editor.
-- Safe to rerun if the column/function already exists.
alter table public.creator_messages
  add column if not exists student_key text;

alter table public.creator_messages enable row level security;
grant usage on schema public to anon, authenticated;
grant insert on public.creator_messages to anon, authenticated;
grant select on public.creator_messages to authenticated;

drop policy if exists "Students can send creator messages" on public.creator_messages;
create policy "Students can send creator messages"
on public.creator_messages for insert to anon, authenticated
with check (
  sender_is_admin = false
  and student_key is not null
  and char_length(student_key) = 36
);

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
