-- Ejecuta todo este archivo en Supabase > SQL Editor > New query.
-- RLS asegura que cada usuario solo pueda leer y modificar sus propios datos.

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  grade numeric(4,2) not null check (grade >= 0 and grade <= 10),
  weight numeric(5,2) not null check (weight > 0 and weight <= 100),
  term text not null default '1ª evaluación',
  exam_date date,
  created_at timestamptz not null default now()
);

create index if not exists modules_user_id_idx on public.modules(user_id);
create index if not exists grades_user_id_idx on public.grades(user_id);
create index if not exists grades_module_id_idx on public.grades(module_id);

alter table public.modules enable row level security;
alter table public.grades enable row level security;

drop policy if exists "Users can read own modules" on public.modules;
create policy "Users can read own modules" on public.modules for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create own modules" on public.modules;
create policy "Users can create own modules" on public.modules for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own modules" on public.modules;
create policy "Users can update own modules" on public.modules for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own modules" on public.modules;
create policy "Users can delete own modules" on public.modules for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can read own grades" on public.grades;
create policy "Users can read own grades" on public.grades for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create own grades" on public.grades;
create policy "Users can create own grades" on public.grades for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.modules m where m.id = module_id and m.user_id = auth.uid()
  )
);
drop policy if exists "Users can update own grades" on public.grades;
create policy "Users can update own grades" on public.grades for update to authenticated using (auth.uid() = user_id) with check (
  auth.uid() = user_id and exists (
    select 1 from public.modules m where m.id = module_id and m.user_id = auth.uid()
  )
);
drop policy if exists "Users can delete own grades" on public.grades;
create policy "Users can delete own grades" on public.grades for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.grades to authenticated;
