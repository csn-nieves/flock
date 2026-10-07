import { useState } from 'react'

import Button from '@src/primitives/Button'
import type {
  EventAttendanceGroup,
  EventResponse,
  EventRunOption,
  RunUnit,
} from '@src/types/events'
import Modal from './Modal'
import RouteMap from './RouteMap'

type EventRunOptionsProps = {
  groups: readonly EventAttendanceGroup[]
  options: readonly EventRunOption[]
  response: EventResponse | null
  selectedRunOptionId: string | null
}

function formatRouteDistance(distanceMeters: number, unit: RunUnit | null) {
  const routeUnit = unit ?? 'mi'
  const divisor = routeUnit === 'mi' ? 1609.344 : 1000
  return `${(distanceMeters / divisor).toFixed(2)} ${routeUnit}`
}

function EventRunOptions({
  groups,
  options,
  response,
  selectedRunOptionId,
}: EventRunOptionsProps) {
  const [mappedOption, setMappedOption] = useState<EventRunOption>()

  if (!options.length) return null

  return (
    <>
      <div className="mt-3 space-y-2" aria-label="Run options">
        {options.map((option) => {
          const group = groups.find(
            (attendance) => attendance.runOptionId === option.id,
          )
          const isOwnChoice =
            response !== 'out' && selectedRunOptionId === option.id
          return (
            <div
              className="rounded-lg bg-surface-subtle px-3 py-2"
              key={option.id}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="m-0 text-sm font-bold text-text">
                  {option.distanceLabel} · {option.paceLabel}
                </p>
                {isOwnChoice ? (
                  <span className="shrink-0 text-xs font-bold text-accent">
                    Your choice
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <p className="m-0 text-xs text-text-muted">
                    {group?.in ?? 0} in · {group?.maybe ?? 0} maybe
                  </p>
                  {option.route ? (
                    <p className="mt-1 mb-0 text-xs font-bold text-primary">
                      Mapped route ·{' '}
                      {formatRouteDistance(
                        option.route.distanceMeters,
                        option.unit,
                      )}
                    </p>
                  ) : null}
                </div>
                {option.route ? (
                  <Button
                    className="min-h-0 shrink-0 px-2 py-1 text-xs"
                    variant="secondary"
                    onClick={() => setMappedOption(option)}
                  >
                    View map
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
        {groups.some((group) => group.runOptionId === null) ? (
          <p className="m-0 text-xs text-text-muted">
            Some earlier responses still need a run option.
          </p>
        ) : null}
      </div>
      {mappedOption?.route ? (
        <Modal
          description={`${mappedOption.distanceLabel} at ${mappedOption.paceLabel}. Route distance ${formatRouteDistance(mappedOption.route.distanceMeters, mappedOption.unit)}.`}
          onClose={() => setMappedOption(undefined)}
          title="Event route"
        >
          <RouteMap route={mappedOption.route} />
        </Modal>
      ) : null}
    </>
  )
}

export default EventRunOptions
