import { useEffect, useRef, useState } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
  prefix?: string
}

export default function AnimatedNumber({
  value,
  duration = 700,
  decimals = 0,
  suffix = '',
  prefix = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const start = performance.now()
    const from = previous.current
    const delta = value - from
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplay(from + delta * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    previous.current = value

    return () => cancelAnimationFrame(frame)
  }, [duration, value])

  return (
    <span className="tabular-nums">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
