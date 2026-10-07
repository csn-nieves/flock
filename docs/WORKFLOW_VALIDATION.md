# Workflow validation plan

Last reviewed: 2026-10-02

## Purpose

Use moderated sessions with real run-club organizers and runners to determine
whether Flock's current coordination workflows are understandable and useful
before selecting another product milestone. This is product discovery, not a
demonstration and not a substitute for automated quality checks.

The study should answer:

- Can an organizer create a flock and bring a runner into it without coaching?
- Can organizers and runners understand the difference between flock events,
  personal events, flock invitations, and event invitations?
- Can a runner find and respond to an event invitation in the app?
- Does a universal flock audience behave the way both roles expect?
- Do notification setup and delivery expectations make sense on supported
  phones and installed PWAs?
- Which observed problems are severe enough to address before routes, pace
  groups, or chat enter scope?

Do not use these sessions to ask participants which large feature should be
built next. First observe whether the existing product solves the coordination
job it already claims to solve.

## Easiest accessible setup

The recommended first round is **three paired sessions**, each with one
organizer and one runner using their own phones. Give everyone the same hosted
preview URL. The organizer drives first, sends the runner a real invitation,
and the runner completes the receiving side. Only one person should drive or
speak through a task at a time so they do not coach each other.

This approach validates six people while requiring only three scheduled
sessions and one test environment. It does not require a production launch,
social-provider approval, push delivery, a custom domain, or app-store access.

### What to host

Use two disposable resources:

1. A Cloudflare Pages preview built from the revision being tested.
2. A separate Supabase project used only for validation data and accounts.

Do not connect the preview to a production database. Do not use a contributor's
local Supabase instance for remote sessions: participants' phones need a stable
HTTPS address that works outside the developer's network.

Configure the Cloudflare Pages preview with:

```text
Build command: npm run build
Build output directory: dist
VITE_SUPABASE_URL: the validation Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY: the validation project's publishable key
```

Cloudflare's current React Pages configuration uses `npm run build` and `dist`,
and a Git-connected project creates preview deployments for pull requests. See
the official [React deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).
Use one stable preview URL for the study rather than a different commit-specific
URL in every session.

The project URL and publishable key are browser-safe configuration. Never add a
service-role key, VAPID private key, or other secret to a `VITE_` variable.

The preview URL is reachable on the public internet even though it is not a
production launch. Keep only disposable test data there, ask participants to
use a first name or study identifier, and rely on the application's existing
authentication and Row Level Security rather than secrecy of the URL.

Apply the committed migrations to the validation Supabase project through the
normal Supabase CLI migration workflow. Do not reproduce the schema manually in
the dashboard. The repository seed is useful locally, but the participant
accounts and session data should be created through the application so the
study exercises the real flows.

From a clean checkout of the exact revision being tested, the remote migration
sequence is:

```sh
npx supabase login
npx supabase link --project-ref <validation-project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Review the dry run before applying it. Do not add `--include-seed`; the committed
seed contains local-development identities rather than participant accounts.
The official Supabase guides document the
[CLI workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
and [`db push`](https://supabase.com/docs/reference/cli/v1/supabase-db-push)
behavior.

### Authentication setup

Use email-code sign-in for the first round. It avoids Google and Facebook
preview configuration and provider-review requirements. A hosted Supabase
project's default mailer is not sufficient for external participants: it sends
only to pre-authorized project-team addresses and is heavily rate-limited.
Configure a custom SMTP sender before scheduling sessions with arbitrary email
addresses. See Supabase's
[custom SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

Before custom SMTP is available, a project-team member may perform a narrow
deployment smoke test with the default mailer. Its confirmation link must be
opened in the same browser that requested it so the `/auth/callback` route can
exchange the PKCE code. This fallback verifies hosted authentication plumbing;
it does not replace the six-digit-code flow required for participant sessions.

In the validation Supabase project:

1. Enable email sign-in and allow account creation.
2. Configure the custom SMTP provider and send a test message.
3. Configure the email template to show the six-digit `{{ .Token }}` value.
4. Set the Auth site URL to the stable preview origin.
5. Add the exact preview callback URL ending in `/auth/callback` to the redirect
   allow list.
6. Send a code to an address that is not a Supabase project-team member and
   complete sign-in before inviting participants.

Supabase documents the OTP template and redirect configuration in its
[passwordless email guide](https://supabase.com/docs/guides/auth/auth-email-passwordless).

Tell participants during the study introduction: “This preview uses email
codes. Please use the email option rather than Google or Facebook.” This is
environment setup, not coaching on the workflow under study.

Participants may use their own email addresses if they consent to creating a
temporary test account. A lower-data alternative is to prepare six email aliases
that forward to a test mailbox and let each participant enter the supplied code
themselves. Never ask a participant using their own inbox to tell the moderator
their one-time code.

### What to leave off

For this first round:

- Do not configure Web Push. Mark external notification delivery as **not
  tested** and validate the durable in-app invitation inbox instead.
- Do not configure Google or Facebook OAuth. Direct participants to email-code
  sign-in in the introduction.
- Do not expose hosted superadmin access. Run the internal admin checklist
  separately against the local seeded environment.
- Do not install a custom domain unless one already exists. A stable HTTPS
  preview URL is sufficient.

These omissions are deliberate reductions in setup, not failed product tests.
A later device-notification session can add VAPID secrets, the Edge Function,
and the database webhook after the core invitation flow has been validated.

### One-hour rehearsal

Before recruiting anyone, rehearse the complete handoff with two phones or one
phone plus a private browser window:

1. Open the preview and sign in by email as the organizer.
2. Create a flock and generate a flock invitation.
3. Open the invitation as a different signed-out runner and join.
4. Confirm the runner appears in the flock roster.
5. Create a flock event.
6. Create a personal event, invite the whole flock, and leave the link unused.
7. On the runner device, find the invitation in Events, accept it, and RSVP.
8. On the organizer device, confirm the attendance response.
9. Reload both devices and confirm the state persists.

Do not start participant sessions until this rehearsal succeeds without using
Supabase Studio to repair data.

### Session-day checklist

For each pair:

1. Reserve 60 minutes and ask both people to bring the phones they normally
   use.
2. Give the organizer and runner distinct participant identifiers such as `O1`
   and `R1`.
3. Start with fresh accounts and create a uniquely named flock for that pair.
4. Run the organizer tasks until the invitation handoff, then let the runner
   take control of their own device.
5. Keep the unused participant from coaching the active participant.
6. Record outcomes and observations without names, emails, or invitation URLs.
7. Spend the last ten minutes on the closing questions.
8. Afterward, stop reusing shared links and let them expire. Remove the
   validation accounts and project after their evidence is no longer needed.

Keep the preview available for the full study, but avoid changing its code
between participants. If a critical defect requires an immediate fix, record
which revision each later session used rather than mixing the evidence.

## Participants and coverage

Recruit at least six participants:

- three people who currently organize a running group;
- three people who currently join organized runs as runners;
- at least one iPhone user and one Android user in each role when practical;
- a mix of people who are comfortable and uncomfortable with installing PWAs.

Do not recruit only contributors, close collaborators, or people who already
know Flock's terminology. Record participants with anonymous identifiers such
as `O1` and `R1`; do not commit names, email addresses, recordings, or other
personal information to this repository.

## Environment and preparation

Use a dedicated preview or test environment with disposable accounts and data.
Never ask a participant to share a password or one-time sign-in code. The
moderator may help retrieve a code from a test mailbox only when authentication
itself is not the behavior under study.

Before the first session:

1. Confirm the preview uses the migrations and application revision being
   evaluated.
2. Prepare one clean organizer account and one clean runner account per
   session.
3. Prepare a second device or browser when an invitation must move between
   people.
4. Confirm email sign-in works in the test environment.
5. If Web Push is configured there, test delivery once on each target platform.
   If it is not configured, evaluate setup copy and the in-app invitation inbox,
   and mark external delivery as **not tested** rather than a failure.
6. Obtain permission before recording a screen or voice. Notes are sufficient.

The current scope intentionally excludes routes, maps, pace groups, chat,
payments, and native applications. Do not represent those capabilities as
available during a session.

## Moderation rules

- Run one participant at a time for approximately 35–45 minutes.
- Ask the participant to think aloud, but do not explain the interface while a
  task is in progress.
- Phrase tasks as goals rather than button instructions.
- If the participant is blocked, record the point of failure before helping.
- Ask what they expect to happen before revealing the result of an invitation,
  membership change, cancellation, or notification action.
- Separate observed behavior from interpretation and requested features.
- End each task after success, abandonment, or moderator intervention.

## Organizer session

Give the participant this context: “You organize a local running group and
want to coordinate an upcoming run with Flock.”

### O1 — Create a flock

Ask: “Create a new group for your runners and make sure another person could
recognize it.”

Observe whether the participant can find flock creation, understands the
required information, and recognizes the resulting flock page.

### O2 — Invite a runner into the flock

Ask: “Bring a runner who is not yet a member into this group.”

Have a moderator or paired runner open the resulting link in a separate signed-
out browser, sign in, and join. Observe link sharing expectations, the 24-hour
window, authentication handoff, and whether the organizer can confirm that the
runner joined.

### O3 — Create a flock event

Ask: “Schedule the group's next run with enough information for a member to
show up.”

Observe how the participant distinguishes the flock's event controls from the
personal Events area, and whether date, time, location, and description feel
sufficient for the task.

### O4 — Create a personal event for the whole flock

Ask: “Plan a run that belongs to you and invite everyone who is currently in
this flock.”

Observe audience search, selection, the meaning of a universal flock invite,
the optional link, and the participant's expectation for later joiners and
departed members. Ask what they believe the seven-day invitation window means.

### O5 — Understand attendance

After the paired runner accepts and responds, ask: “Find out who is planning to
attend and what their response is.”

Observe whether the creator can return to the event and interpret attendance.

## Runner session

Give the participant this context: “A local running group has invited you to
join and attend an upcoming run.”

### R1 — Join a flock from a link

Open a valid flock invitation in a signed-out browser and ask: “Use this invite
to join the group.”

Observe the sign-in handoff, destination restoration, success feedback, and
whether the resulting membership is clear.

### R2 — Find the information needed to attend

Ask: “Find the next group run and tell me where and when you would meet.”

Observe navigation, event terminology, date and time interpretation, location,
and whether the runner looks for route or pace information that does not yet
exist.

### R3 — Accept a personal-event invitation in app

Create a targeted or universal invitation without giving the participant its
link. Ask: “Someone invited you to a run. Find and accept it in Flock.”

Observe whether the participant finds the Events invitation inbox, understands
the inviter and event information, and knows what acceptance changes.

### R4 — Respond to the event

Ask: “You might attend. Record that response, then change it to the answer you
would give if your schedule became certain.”

Observe the meanings of “I'm in,” “Maybe,” and “I'm out,” and whether updating
a response feels reversible.

### R5 — Configure invitation alerts

Ask: “Set up this device so it can alert you about future event invitations.”

Observe Settings discovery, permission expectations, installed-PWA guidance,
blocked or unsupported states, and whether the participant understands that
the Events inbox remains authoritative. Test an external notification only
when Web Push is actually configured for the environment and device.

### R6 — Review flock membership

Ask: “Find the other people in the group and check what information about you
is visible to them.”

Observe roster comprehension, owner/member roles, profile editing, and comfort
with the displayed name and coarse location.

## Internal admin check

Superadmin controls are an operational workflow, not an organizer or runner
task. A project operator should separately verify that they can:

1. locate an event and confirm its creator, audience, status, date, and
   location;
2. cancel an upcoming event while preserving its record;
3. locate an ordinary membership and remove it after confirmation;
4. understand why an owner membership cannot be removed there; and
5. confirm that member removal does not delete the account, flock, or personal
   events.

Do not give real participants superadmin credentials.

## Evidence scale

Classify each task with one outcome:

| Outcome                 | Definition                                                                |
| ----------------------- | ------------------------------------------------------------------------- |
| Completed               | Finished without moderator help.                                          |
| Completed with friction | Finished, but with hesitation, backtracking, or a misleading expectation. |
| Assisted                | Required a hint or moderator intervention.                                |
| Abandoned               | Could not finish or chose to stop.                                        |
| Not tested              | Environment or session constraints prevented a valid attempt.             |

Classify each finding separately:

| Severity       | Definition                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Critical       | Causes unauthorized disclosure, destructive surprise, or loss of access/data. Address immediately.       |
| Blocker        | Prevents a core task from being completed without help.                                                  |
| Major friction | Task completes, but the same misunderstanding or detour materially harms confidence.                     |
| Minor friction | Local hesitation or copy problem that does not threaten completion.                                      |
| Preference     | A requested alternative without observed task harm. Preserve as evidence; do not automatically build it. |

## Session record

Copy this section once per participant into a private research record. Commit
only anonymized findings that are needed for product decisions.

```md
### Participant [O1/R1]

- Role:
- Device and browser:
- Installed PWA: yes / no
- Prior Flock exposure: none / limited
- Tasks attempted:

| Task | Outcome | What happened | Moderator help |
| ---- | ------- | ------------- | -------------- |
|      |         |               |                |

#### Observed findings

| Severity | Observation | Evidence | Workflow |
| -------- | ----------- | -------- | -------- |
|          |             |          |          |

#### Closing questions

- What, if anything, would you use Flock for after this session?
- What felt least trustworthy or least clear?
- What would still force you to use another app for this same run?
- Is there anything you expected Flock to do that it did not do?
```

## Synthesis and decision rule

After all sessions, group findings by underlying workflow problem rather than
by participant wording. Use this table in the final synthesis:

```md
| Workflow problem | Participants affected | Highest severity | Evidence | Recommended response |
| ---------------- | --------------------: | ---------------- | -------- | -------------------- |
|                  |                       |                  |          |                      |
```

Apply these rules:

- Treat any critical finding as its own immediate branch.
- Prioritize a blocker observed in two participants, or in one participant
  when it is reproducible and prevents the promised workflow.
- Prefer fixing repeated major friction before choosing a new feature area.
- Preserve one-person preferences without turning them into requirements.
- Do not count moderator explanations as successful completion.
- Distinguish product failure from an unavailable test service, especially for
  Web Push.

The validation milestone is complete when at least three organizers and three
runners have participated, both iPhone and Android use are represented, every
core task has valid evidence, and all critical findings have an explicit
resolution. Repeated blockers must also have a planned fix or an explicit
product decision. The next product milestone should be selected from the
synthesized evidence and recorded in `docs/CURRENT_STATE.md`.
