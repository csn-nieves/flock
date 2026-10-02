create policy "Superadmins can read all profiles"
on public.profiles for select to authenticated
using ((select private.is_superadmin()));
