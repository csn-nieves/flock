import { spawn, spawnSync } from 'node:child_process'

const statusResult = spawnSync(
  'npx',
  ['--no-install', 'supabase', 'status', '--output', 'json'],
  {
    encoding: 'utf8',
  },
)

if (statusResult.status !== 0) {
  process.stderr.write(statusResult.stderr)
  console.error(
    'Unable to read the local Supabase configuration. Is Docker running?',
  )
  process.exit(statusResult.status ?? 1)
}

let localSupabase

try {
  localSupabase = JSON.parse(statusResult.stdout)
} catch {
  console.error('Supabase returned an unexpected status response.')
  process.exit(1)
}

const supabaseUrl = localSupabase.API_URL
const supabasePublishableKey = localSupabase.PUBLISHABLE_KEY

if (
  typeof supabaseUrl !== 'string' ||
  typeof supabasePublishableKey !== 'string'
) {
  console.error(
    'Supabase status did not include its public API URL and publishable key.',
  )
  process.exit(1)
}

console.log(`Starting Flock with local Supabase at ${supabaseUrl}`)

const logProcesses = [
  'supabase_kong_flock',
  'supabase_rest_flock',
  'supabase_db_flock',
].map((serviceName) => {
  console.log(`Streaming new ${serviceName} logs…`)
  const logProcess = spawn(
    'docker',
    ['logs', '--follow', '--tail', '0', '--timestamps', serviceName],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )

  const writeLog = (chunk) => {
    const lines = chunk.toString().split(/(?<=\n)/)
    for (const line of lines) {
      if (line) process.stdout.write(`[${serviceName}] ${line}`)
    }
  }

  logProcess.stdout.on('data', writeLog)
  logProcess.stderr.on('data', writeLog)
  logProcess.on('error', (error) => {
    console.error(`Unable to stream ${serviceName}: ${error.message}`)
  })

  return logProcess
})

function stopLogProcesses() {
  for (const logProcess of logProcesses) {
    if (!logProcess.killed) {
      logProcess.kill('SIGTERM')
    }
  }
}

const viteProcess = spawn('npm', ['run', 'dev'], {
  env: {
    ...process.env,
    VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
    VITE_SUPABASE_URL: supabaseUrl,
  },
  stdio: 'inherit',
})

viteProcess.on('error', (error) => {
  stopLogProcesses()
  console.error(`Unable to start Vite: ${error.message}`)
  process.exit(1)
})

viteProcess.on('exit', (code, signal) => {
  stopLogProcesses()
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
