# Flock product foundation

## Purpose

Flock helps run clubs organize group runs and keep their members connected. Organizers can plan runs, define route, distance, and pace options, track attendance, and communicate with runners in one place.

## Initial users

### Organizers

People who create and manage local run clubs. They need a simple way to coordinate members and recurring group runs without spreading information across several apps.

### Runners

People who join run clubs. They need to know where and when the next run starts, which distance and pace groups are available, who is attending, and where to find updates.

## Product direction

Each run club is called a **flock**. A flock will eventually support:

- Group membership
- Scheduled run events
- Planned routes imported from GPX or drawn along walkable roads and displayed
  on a map
- One or more distance options per event, each with a target pace or an explicit
  run-at-your-own-pace choice
- A private reusable route library for saving, previewing, naming, and applying
  frequently used courses to future events
- Repeatable personal and flock event plans that require a new date and keep
  each event's invitations and attendance independent
- RSVPs tied to a selected distance and pace
- A private real-time flock chat for current members, with older history loaded
  continuously as a runner scrolls upward
- Future one-to-one runner communication

## Delivery model

Flock will launch as a mobile-first progressive web app. Every core workflow must work comfortably on a phone and remain useful on desktop, particularly for organizers.

The first authentication options will be Google, Facebook, and email.

## First development slice

The first usable flow is flock membership:

1. A person signs in with Google, Facebook, or email.
2. An organizer creates a flock with a name, location, and short description.
3. The organizer receives a shareable invitation link.
4. Another person opens the link and signs in.
5. That person joins the flock immediately.
6. Members can view the flock's member list.

The initial roles are `owner` and `member`.

## Outside the first slice

The first development slice will not include:

- Run events
- Routes or maps
- Distance or pace groups
- Chat or direct messages
- Public flock discovery
- Notifications
- Payments or subscriptions
- Live run tracking
- Performance statistics
- Strava, Garmin, or other fitness integrations
- Native iOS or Android applications

## Product principles

- Design for phone use first.
- Keep each workflow focused and easy to complete outdoors.
- Build and review the product in cohesive, independently reviewable branches
  that complete one clear outcome without unrelated work.
- Validate behavior with real organizers and runners before expanding scope.
- Add complexity only when observed usage justifies it.
- Treat monetization as an experiment after the core coordination workflow is useful.
