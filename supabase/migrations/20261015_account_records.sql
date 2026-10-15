begin;

create table if not exists public.amiao_user_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.amiao_user_state enable row level security;
revoke all on public.amiao_user_state from anon, authenticated;
grant select on public.amiao_user_state to authenticated;
drop policy if exists "Read only my Amiao records" on public.amiao_user_state;
create policy "Read only my Amiao records" on public.amiao_user_state
 for select to authenticated using ((select auth.uid()) = user_id);

-- Writes are atomic and reject stale versions from another browser/device.
create or replace function public.save_amiao_state(p_expected_revision bigint, p_snapshot jsonb)
returns table(revision bigint, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_row public.amiao_user_state%rowtype;
begin
 if v_user is null or coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
  raise exception 'Authentication required' using errcode = '42501';
 end if;
 if p_expected_revision is null or p_expected_revision < 0
  or p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object'
  or jsonb_typeof(p_snapshot->'letters') is distinct from 'array'
  or jsonb_typeof(p_snapshot->'todos') is distinct from 'array'
  or jsonb_typeof(p_snapshot->'alarms') is distinct from 'array'
  or octet_length(p_snapshot::text) > 8388608 then
  raise exception 'Invalid or oversized snapshot' using errcode = '22023';
 end if;
 if p_expected_revision = 0 then
  insert into public.amiao_user_state(user_id,payload,revision)
   values(v_user,p_snapshot,1) on conflict(user_id) do nothing returning * into v_row;
 else
  update public.amiao_user_state as s set payload=p_snapshot,revision=s.revision+1,updated_at=now()
   where s.user_id=v_user and s.revision=p_expected_revision returning s.* into v_row;
 end if;
 if not found then
  raise exception 'amiao_revision_conflict' using errcode = '40001';
 end if;
 return query select v_row.revision,v_row.updated_at;
end;
$$;
revoke all on function public.save_amiao_state(bigint,jsonb) from public,anon,authenticated;
grant execute on function public.save_amiao_state(bigint,jsonb) to authenticated;

commit;
