-- IPI-V2-000 · SB-FIX-009 — Lock mutable search_path on trigger helpers.
-- Bodies only stamp NEW fields (no relation lookup). Empty search_path is safe.
--
-- Rollback:
--   alter function public.stamp_analysis_locked_at() reset search_path;
--   alter function public.set_updated_at() reset search_path;
--   alter function public.trigger_set_timestamps() reset search_path;

alter function public.stamp_analysis_locked_at() set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.trigger_set_timestamps() set search_path = '';
