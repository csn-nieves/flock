import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const bucket = 'flock-media'
const assetRoot = new URL('../supabase/seed-media/', import.meta.url)

function readLocalStatus() {
  const output = execFileSync(
    './node_modules/.bin/supabase',
    ['status', '-o', 'env'],
    {
      encoding: 'utf8',
    },
  )
  const values = {}
  for (const line of output.split(/\r?\n/)) {
    const separator = line.indexOf('=')
    if (separator === -1) continue
    values[line.slice(0, separator)] = line
      .slice(separator + 1)
      .replace(/^['"]|['"]$/g, '')
  }
  const url = values.API_URL ?? values.SUPABASE_URL
  const serviceRoleKey = values.SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Local Supabase is not running or did not report API_URL and SERVICE_ROLE_KEY.',
    )
  }
  return { url, serviceRoleKey }
}

async function fetchRows(client, table, column = 'id') {
  const { data, error } = await client.from(table).select(column).order(column)
  if (error) throw new Error(`Could not read ${table}: ${error.message}`)
  return data
}

async function upload(client, path, filename) {
  const file = await readFile(new URL(filename, assetRoot))
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: 'image/png',
    upsert: true,
  })
  if (error) throw new Error(`Could not upload ${path}: ${error.message}`)
}

const { url, serviceRoleKey } = readLocalStatus()
const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const profiles = await fetchRows(client, 'profiles', 'user_id')
const flocks = await fetchRows(client, 'flocks')
const events = await fetchRows(client, 'flock_events')
const portraits = [
  'runner-portrait-01.png',
  'runner-portrait-02.png',
  'runner-portrait-03.png',
]
const flockCovers = ['flock-runners-01.png']
const eventCovers = ['event-riverside-01.png', 'event-trail-01.png']

for (const [index, profile] of profiles.entries()) {
  await upload(
    client,
    `profiles/${profile.user_id}/avatar`,
    portraits[index % portraits.length],
  )
}
for (const [index, flock] of flocks.entries()) {
  await upload(
    client,
    `flocks/${flock.id}/cover`,
    flockCovers[index % flockCovers.length],
  )
}
for (const [index, event] of events.entries()) {
  await upload(
    client,
    `events/${event.id}/cover`,
    eventCovers[index % eventCovers.length],
  )
}

console.log(
  `Seed media uploaded: ${profiles.length} profiles, ${flocks.length} flocks, ${events.length} events.`,
)
