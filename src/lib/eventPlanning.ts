import type {
  EventFormInput,
  EventRoute,
  EventRunOption,
  FlockEvent,
} from '@src/types/events'

type EventFormIntent = 'edit' | 'repeat'

function copyRoute(route: EventRoute | null | undefined) {
  if (!route) return undefined

  return {
    coordinates: route.coordinates.map(
      ([longitude, latitude]) => [longitude, latitude] as [number, number],
    ),
    distanceMeters: route.distanceMeters,
  }
}

function runOptionToFormValue(option: EventRunOption, intent: EventFormIntent) {
  return {
    distanceTenths: option.distanceTenths ?? 50,
    ...(intent === 'edit' ? { id: option.id } : {}),
    legacyLabel:
      option.distanceTenths === null
        ? `${option.distanceLabel} · ${option.paceLabel}`
        : undefined,
    paceSeconds: option.distanceTenths === null ? 8 * 60 : option.paceSeconds,
    route: copyRoute(option.route),
    unit: option.unit ?? 'mi',
  }
}

export function eventToFormValues(
  event: FlockEvent,
  intent: EventFormIntent,
): EventFormInput {
  return {
    description: event.description,
    location: event.location,
    runOptions: event.runOptions.map((option) =>
      runOptionToFormValue(option, intent),
    ),
    startsAt: intent === 'edit' ? event.startsAt.slice(0, 16) : '',
    title: event.title,
  }
}
