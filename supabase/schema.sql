
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- COURSES TABLE
-- =============================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  thumbnail_url text,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  duration_minutes integer default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  published_at timestamp with time zone
);

-- =============================================
-- MODULES TABLE
-- =============================================
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- LESSONS TABLE
-- =============================================
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text,
  duration_seconds integer default 0,
  order_index integer not null default 0,
  type text not null default 'video' check (type in ('video', 'quiz', 'reading')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =============================================
-- ENROLLMENTS TABLE
-- =============================================
create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
  enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  unique(user_id, course_id)
);

-- =============================================
-- PROGRESS TABLE
-- =============================================
create table public.progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed boolean default false,
  watch_time_seconds integer default 0,
  last_watched_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, lesson_id)
);

-- =============================================
-- CERTIFICATES TABLE
-- =============================================
create table public.certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  certificate_number text unique not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

-- =============================================
-- VIEWS FOR EASIER QUERYING
-- =============================================

-- Course with stats
create or replace view public.courses_with_stats as
select 
  c.*,
  count(distinct e.id) as enrollment_count,
  count(distinct m.id) as module_count,
  count(distinct l.id) as lesson_count
from public.courses c
left join public.enrollments e on e.course_id = c.id
left join public.modules m on m.course_id = c.id
left join public.lessons l on l.module_id = m.id
group by c.id;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;

-- Profiles: users can read all, update own
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Courses: published visible to all, drafts to admins only
create policy "Published courses are viewable by everyone" on public.courses
  for select using (status = 'published' or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can manage courses" on public.courses
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Modules & Lessons: viewable if course is accessible
create policy "Modules viewable if course accessible" on public.modules
  for select using (exists (
    select 1 from public.courses c 
    where c.id = course_id 
    and (c.status = 'published' or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ))
  ));

create policy "Admins can manage modules" on public.modules
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Lessons viewable if module accessible" on public.lessons
  for select using (exists (
    select 1 from public.modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id 
    and (c.status = 'published' or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ))
  ));

create policy "Admins can manage lessons" on public.lessons
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Enrollments: users see own, admins see all
create policy "Users can view own enrollments" on public.enrollments
  for select using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "Users can enroll themselves" on public.enrollments
  for insert with check (auth.uid() = user_id);

create policy "Admins can manage enrollments" on public.enrollments
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Progress: users manage own
create policy "Users can manage own progress" on public.progress
  for all using (auth.uid() = user_id);

create policy "Admins can view all progress" on public.progress
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Certificates: users see own, admins see all
create policy "Users can view own certificates" on public.certificates
  for select using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

create policy "System can issue certificates" on public.certificates
  for insert with check (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) or auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKET FOR VIDEOS
-- =============================================
-- Run these in the Supabase Dashboard > Storage

-- Create bucket: course-videos (public)
-- Create bucket: thumbnails (public)

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
create index idx_courses_status on public.courses(status);
create index idx_courses_created_by on public.courses(created_by);
create index idx_modules_course_id on public.modules(course_id);
create index idx_modules_order on public.modules(course_id, order_index);
create index idx_lessons_module_id on public.lessons(module_id);
create index idx_lessons_order on public.lessons(module_id, order_index);
create index idx_enrollments_user_id on public.enrollments(user_id);
create index idx_enrollments_course_id on public.enrollments(course_id);
create index idx_progress_user_id on public.progress(user_id);
create index idx_progress_lesson_id on public.progress(lesson_id);
