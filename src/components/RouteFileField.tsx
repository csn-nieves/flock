import { useId, useState, type ChangeEvent } from 'react'

import { GpxParseError, parseGpxFile } from '@src/lib/gpx'
import Button from '@src/primitives/Button'
import type { EventRoute, RunUnit } from '@src/types/events'
import RouteMap from './RouteMap'

type RouteFileFieldProps = {
  distanceTenths: number
  onChange: (route: EventRoute | undefined) => void
  unit: RunUnit
  value?: EventRoute
}

function formatDistance(distanceMeters: number, unit: RunUnit) {
  const divisor = unit === 'mi' ? 1609.344 : 1000
  return `${(distanceMeters / divisor).toFixed(2)} ${unit}`
}

function RouteFileField({
  distanceTenths,
  onChange,
  unit,
  value,
}: RouteFileFieldProps) {
  const inputId = useId()
  const [error, setError] = useState<string>()
  const [isReading, setIsReading] = useState(false)
  let chooseFileLabel = 'Choose GPX file'
  if (value) chooseFileLabel = 'Replace GPX file'
  if (isReading) chooseFileLabel = 'Reading GPX…'
  const expectedDistanceMeters =
    (distanceTenths / 10) * (unit === 'mi' ? 1609.344 : 1000)
  const routeDistanceDiffers = value
    ? Math.abs(value.distanceMeters - expectedDistanceMeters) /
        expectedDistanceMeters >
      0.2
    : false

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(undefined)
    setIsReading(true)
    try {
      onChange(await parseGpxFile(file))
    } catch (caughtError) {
      setError(
        caughtError instanceof GpxParseError
          ? caughtError.message
          : 'We could not read this GPX file. Try exporting it again.',
      )
    } finally {
      setIsReading(false)
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-bold text-text">Mapped route</p>
          <p className="mt-1 mb-0 text-xs leading-5 text-text-muted">
            Optional GPX file, up to 2 MB. Only the route line is saved.
          </p>
        </div>
        {value ? (
          <span className="shrink-0 text-xs font-bold text-primary">
            {formatDistance(value.distanceMeters, unit)}
          </span>
        ) : null}
      </div>
      <input
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        aria-label="GPX route file"
        className="sr-only"
        id={inputId}
        type="file"
        onChange={selectFile}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          aria-busy={isReading || undefined}
          disabled={isReading}
          type="button"
          variant="secondary"
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {chooseFileLabel}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(undefined)}
          >
            Remove route
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 mb-0 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {value && routeDistanceDiffers ? (
        <p className="mt-2 mb-0 text-sm text-text-muted" role="status">
          This route is {formatDistance(value.distanceMeters, unit)}, which
          differs from the selected distance. Check both before saving.
        </p>
      ) : null}
      {value ? (
        <div className="mt-3">
          <RouteMap route={value} />
        </div>
      ) : null}
    </div>
  )
}

export default RouteFileField
