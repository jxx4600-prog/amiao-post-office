-- Run as the Supabase SQL Editor's postgres role. All test writes are rolled back.
begin;
do $test$
declare
 owner_id uuid; prior bigint; saved bigint; denied boolean := false;
 snapshot jsonb := '{"letters":[],"todos":[],"alarms":[],"draft":{"text":"AMIAO_ROLLBACK_ONLY_TEST"}}'::jsonb;
begin
 select id into owner_id from auth.users order by created_at limit 1;
 if owner_id is null then raise exception 'Create and verify an email user before this test'; end if;
 select revision into prior from public.amiao_user_state where user_id=owner_id;
 prior:=coalesce(prior,0);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',false)::text,true);
 execute 'set local role authenticated';
 select revision into saved from public.save_amiao_state(prior,snapshot);
 if saved<>prior+1 then raise exception 'Owner write failed'; end if;
 if (select count(*) from public.amiao_user_state)<>1 then raise exception 'Owner RLS read failed'; end if;
 begin
  perform public.save_amiao_state(prior,snapshot);
 exception when sqlstate '40001' then denied:=true;
 end;
 if not denied then raise exception 'Stale write was accepted'; end if;
 perform set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}',true);
 if (select count(*) from public.amiao_user_state)<>0 then raise exception 'Cross-account data exposed'; end if;
 execute 'set local role anon';
 perform set_config('request.jwt.claims','{"role":"anon"}',true);
 denied:=false;
 begin perform count(*) from public.amiao_user_state; exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Anonymous read unexpectedly permitted'; end if;
 denied:=false;
 begin perform public.save_amiao_state(0,snapshot); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Anonymous write unexpectedly permitted'; end if;
 execute 'reset role';
end;
$test$;
select 'PASS: owner read/write, stale-version rejection, cross-account isolation, anonymous read/write rejection. Test data is rolled back.' as result;
rollback;
