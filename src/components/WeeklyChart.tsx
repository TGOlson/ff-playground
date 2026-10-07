import { CURRENT_WEEK } from '../data/mock'

/** Weekly fantasy points as bars, with a dashed season-average line and the
 *  current-week projection as a hollow bar. */
export function WeeklyChart({ weekly, proj, avg }: { weekly: (number | null)[]; proj: number; avg: number }) {
  const values = [...weekly.map((w) => w ?? 0), proj]
  const max = Math.max(...values, avg, 1) * 1.15
  const H = 132
  const barW = 100 / values.length
  return (
    <div className="relative">
      <div className="relative" style={{ height: H }}>
        <div
          className="absolute inset-x-0 border-t border-dashed border-faint/70"
          style={{ bottom: (avg / max) * H }}
        />
        <div className="absolute inset-0 flex items-end">
          {values.map((v, i) => {
            const isProj = i === values.length - 1
            const bye = !isProj && weekly[i] === null
            const h = Math.max(3, (v / max) * H)
            return (
              <div key={i} className="flex h-full flex-col items-center justify-end px-[5px]" style={{ width: `${barW}%` }}>
                <span className="tnum mb-1 text-[10.5px] font-semibold text-ink-2">{bye ? '' : v.toFixed(1)}</span>
                <div
                  className={
                    bye
                      ? 'w-full rounded-md bg-surface-2'
                      : isProj
                        ? 'w-full rounded-md border-2 border-dashed border-accent/60 bg-accent-soft'
                        : v >= avg
                          ? 'w-full rounded-md bg-accent'
                          : 'w-full rounded-md bg-accent/35'
                  }
                  style={{ height: bye ? 3 : h }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex">
        {values.map((_, i) => (
          <div key={i} className="text-center text-[10.5px] font-semibold text-faint" style={{ width: `${barW}%` }}>
            {i === values.length - 1 ? `W${CURRENT_WEEK}*` : weekly[i] === null ? 'BYE' : `W${i + 1}`}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ values, className }: { values: (number | null)[]; className?: string }) {
  const v = values.map((x) => x ?? 0)
  const max = Math.max(...v, 1)
  return (
    <div className={`flex h-6 items-end gap-[3px] ${className ?? ''}`}>
      {v.map((x, i) => (
        <div
          key={i}
          className="w-[5px] rounded-[2px] bg-accent/70"
          style={{ height: `${Math.max(10, (x / max) * 100)}%`, opacity: values[i] === null ? 0.2 : 1 }}
        />
      ))}
    </div>
  )
}
