alter table public.flocks
add column location text,
add column description text;

alter table public.flocks
add constraint flocks_location_length_check check (
  location is null
  or (
    location = btrim(location)
    and char_length(location) between 1 and 120
  )
),
add constraint flocks_description_length_check check (
  description is null
  or (
    description = btrim(description)
    and char_length(description) between 1 and 240
  )
);

grant insert (location, description) on table public.flocks to authenticated;
grant update (location, description) on table public.flocks to authenticated;

comment on column public.flocks.location is
  'Coarse city, region, or meeting area shown to flock members.';

comment on column public.flocks.description is
  'Short public-to-members description of the flock.';
