import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react'
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from '@ncdai/react-wheel-picker'
import '@ncdai/react-wheel-picker/style.css'
import type { EventRunOptionInput, RunUnit } from '@src/types/events'

type RunOptionPickerProps = {
  index: number
  onChange: (value: EventRunOptionInput) => void
  value: EventRunOptionInput
  legacyLabel?: string
}

type AccessibleWheelProps = {
  label: string
  onChange: (value: number) => void
  options: WheelPickerOption<number>[]
  value: number
}

const distanceWholeOptions = Array.from({ length: 101 }, (_, value) => ({
  label: String(value),
  value,
}))

const decimalOptions = Array.from({ length: 10 }, (_, value) => ({
  label: `.${value}`,
  value,
}))

const secondOptions = Array.from({ length: 12 }, (_, index) => ({
  label: String(index * 5).padStart(2, '0'),
  value: index * 5,
}))

const paceRanges: Record<RunUnit, { max: number; min: number }> = {
  mi: { max: 15 * 60, min: 4 * 60 },
  km: { max: 9 * 60 + 30, min: 2 * 60 + 30 },
}

const defaultPaces: Record<RunUnit, number> = {
  mi: 8 * 60,
  km: 5 * 60,
}

const wheelClassNames = {
  highlightItem:
    'font-display text-[1.7rem] font-medium tabular-nums text-white',
  highlightWrapper: 'run-wheel-highlight',
  optionItem:
    'font-display text-[1.35rem] font-medium tabular-nums text-white/45',
}

function clampPace(paceSeconds: number, unit: RunUnit) {
  const { max, min } = paceRanges[unit]
  return Math.min(max, Math.max(min, paceSeconds))
}

function convertPace(paceSeconds: number, fromUnit: RunUnit, toUnit: RunUnit) {
  if (fromUnit === toUnit) return paceSeconds
  const converted =
    toUnit === 'km' ? paceSeconds / 1.609344 : paceSeconds * 1.609344
  return clampPace(Math.round(converted / 5) * 5, toUnit)
}

function AccessibleWheel({
  label,
  onChange,
  options,
  value,
}: AccessibleWheelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedIndex = options.findIndex((option) => option.value === value)

  useEffect(() => {
    const wheel = rootRef.current?.querySelector<HTMLElement>('[data-rwp]')
    const selected = options[selectedIndex]
    if (!wheel || !selected) return
    wheel.setAttribute('aria-label', label)
    wheel.setAttribute('aria-valuemax', String(options.at(-1)?.value ?? value))
    wheel.setAttribute('aria-valuemin', String(options[0]?.value ?? value))
    wheel.setAttribute('aria-valuenow', String(value))
    wheel.setAttribute('aria-valuetext', String(selected.label))
    wheel.setAttribute('role', 'spinbutton')
    wheel
      .querySelectorAll('[data-rwp-options], [data-rwp-highlight-list]')
      .forEach((list) => list.setAttribute('aria-hidden', 'true'))
  }, [label, options, selectedIndex, value])

  return (
    <div className="w-16 min-w-0 flex-none" ref={rootRef}>
      <WheelPicker
        classNames={wheelClassNames}
        infinite
        optionItemHeight={38}
        options={options}
        scrollSensitivity={4}
        value={value}
        visibleCount={12}
        onValueChange={onChange}
      />
    </div>
  )
}

function WheelSurface({ children }: { children: ReactNode }) {
  return (
    <div className="run-wheel-surface relative overflow-hidden rounded-lg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-1/2 z-0 h-[38px] -translate-y-1/2 rounded-md bg-white/10"
      />
      <WheelPickerWrapper className="run-wheel-columns relative z-10">
        {children}
      </WheelPickerWrapper>
    </div>
  )
}

function RunOptionPicker({
  index,
  legacyLabel,
  onChange,
  value,
}: RunOptionPickerProps) {
  const optionNumber = index + 1
  const unitGroupId = useId()
  const paceGroupId = useId()
  const distanceWhole = Math.floor(value.distanceTenths / 10)
  const distanceDecimal = value.distanceTenths % 10
  const activePaceSeconds = value.paceSeconds ?? defaultPaces[value.unit]
  const paceMinutes = Math.floor(activePaceSeconds / 60)
  const paceSeconds = activePaceSeconds % 60
  const minuteOptions = useMemo(() => {
    const { max, min } = paceRanges[value.unit]
    const first = Math.floor(min / 60)
    const last = Math.floor(max / 60)
    return Array.from({ length: last - first + 1 }, (_, index) => {
      const minute = first + index
      return { label: String(minute), value: minute }
    })
  }, [value.unit])
  const availableDecimals = decimalOptions.map((option) => ({
    ...option,
    disabled:
      (distanceWhole === 0 && option.value === 0) ||
      (distanceWhole === 100 && option.value !== 0),
  }))
  const availableSeconds = secondOptions.map((option) => ({
    ...option,
    disabled:
      paceMinutes * 60 + option.value < paceRanges[value.unit].min ||
      paceMinutes * 60 + option.value > paceRanges[value.unit].max,
  }))

  function updateUnit(unit: RunUnit) {
    const convertedPace = convertPace(activePaceSeconds, value.unit, unit)
    onChange({
      ...value,
      paceSeconds: value.paceSeconds === null ? null : convertedPace,
      unit,
    })
  }

  return (
    <div className="space-y-4">
      {legacyLabel ? (
        <p className="m-0 rounded-md border border-border bg-background px-3 py-2 text-xs leading-5 text-text-muted">
          Previously: {legacyLabel}. Review this option before saving.
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-text" id={unitGroupId}>
          Measurement
        </legend>
        <div
          aria-labelledby={unitGroupId}
          className="grid grid-cols-2 rounded-md bg-background p-1 ring-1 ring-border"
          role="radiogroup"
        >
          {(['mi', 'km'] as const).map((unit) => (
            <button
              aria-checked={value.unit === unit}
              className="min-h-touch cursor-pointer rounded-sm px-3 text-sm font-bold text-text transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[checked=true]:bg-primary data-[checked=true]:text-on-primary"
              data-checked={value.unit === unit}
              key={unit}
              role="radio"
              type="button"
              onClick={() => updateUnit(unit)}
            >
              {unit === 'mi' ? 'Miles' : 'Kilometers'}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="m-0 text-sm font-bold text-text">Distance</p>
          <output className="text-xs text-text-muted">
            {(value.distanceTenths / 10).toFixed(1)} {value.unit}
          </output>
        </div>
        <WheelSurface>
          <AccessibleWheel
            label={`Whole distance for option ${optionNumber}`}
            options={distanceWholeOptions}
            value={distanceWhole}
            onChange={(nextWhole) => {
              let nextDecimal = distanceDecimal
              if (nextWhole === 0 && nextDecimal === 0) nextDecimal = 1
              if (nextWhole === 100) nextDecimal = 0
              onChange({
                ...value,
                distanceTenths: nextWhole * 10 + nextDecimal,
              })
            }}
          />
          <AccessibleWheel
            label={`Distance decimal for option ${optionNumber}`}
            options={availableDecimals}
            value={distanceDecimal}
            onChange={(nextDecimal) =>
              onChange({
                ...value,
                distanceTenths: distanceWhole * 10 + nextDecimal,
              })
            }
          />
          <div
            aria-hidden="true"
            className="flex w-16 flex-none items-center justify-center font-display text-[1.7rem] font-medium text-white"
          >
            {value.unit}
          </div>
        </WheelSurface>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold text-text" id={paceGroupId}>
          Pace
        </legend>
        <div
          aria-labelledby={paceGroupId}
          className="grid grid-cols-2 rounded-md bg-background p-1 ring-1 ring-border"
          role="radiogroup"
        >
          <button
            aria-checked={value.paceSeconds !== null}
            className="min-h-touch cursor-pointer rounded-sm px-3 text-sm font-bold text-text transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[checked=true]:bg-primary data-[checked=true]:text-on-primary"
            data-checked={value.paceSeconds !== null}
            role="radio"
            type="button"
            onClick={() =>
              onChange({ ...value, paceSeconds: defaultPaces[value.unit] })
            }
          >
            Target pace
          </button>
          <button
            aria-checked={value.paceSeconds === null}
            className="min-h-touch cursor-pointer rounded-sm px-3 text-sm font-bold text-text transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[checked=true]:bg-primary data-[checked=true]:text-on-primary"
            data-checked={value.paceSeconds === null}
            role="radio"
            type="button"
            onClick={() => onChange({ ...value, paceSeconds: null })}
          >
            Run at your own pace
          </button>
        </div>
      </fieldset>

      {value.paceSeconds !== null ? (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="m-0 text-sm font-bold text-text">Target pace</p>
            <output className="text-xs text-text-muted">
              {paceMinutes}:{String(paceSeconds).padStart(2, '0')}/{value.unit}
            </output>
          </div>
          <WheelSurface>
            <AccessibleWheel
              label={`Pace minutes for option ${optionNumber}`}
              options={minuteOptions}
              value={paceMinutes}
              onChange={(nextMinutes) =>
                onChange({
                  ...value,
                  paceSeconds: clampPace(
                    nextMinutes * 60 + paceSeconds,
                    value.unit,
                  ),
                })
              }
            />
            <div
              aria-hidden="true"
              className="flex w-3 flex-none items-center justify-center font-display text-[1.7rem] font-medium text-white"
            >
              :
            </div>
            <AccessibleWheel
              label={`Pace seconds for option ${optionNumber}`}
              options={availableSeconds}
              value={paceSeconds}
              onChange={(nextSeconds) =>
                onChange({
                  ...value,
                  paceSeconds: paceMinutes * 60 + nextSeconds,
                })
              }
            />
            <div
              aria-hidden="true"
              className="flex w-16 flex-none items-center justify-center font-display text-[1.7rem] font-medium text-white"
            >
              /{value.unit}
            </div>
          </WheelSurface>
        </div>
      ) : (
        <p className="m-0 rounded-md border border-border bg-background px-3 py-3 text-sm leading-5 text-text-muted">
          Runners choose this distance and complete it at their own pace.
        </p>
      )}

      <p className="m-0 text-xs leading-5 text-text-muted">
        Measurement always applies to distance and any target pace. Target pace
        ranges from 4:00–15:00 per mile or 2:30–9:30 per kilometer.
      </p>
    </div>
  )
}

export default RunOptionPicker
