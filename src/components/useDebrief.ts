import { useEffect, useState } from 'react'
import type { Language, Problem, VerifyResult } from '../model/types'

export function useDebrief(
  problem: Problem,
  result: VerifyResult | null,
  language: Language,
) {
  const [open, setOpen] = useState(false)
  const hasDebrief = (problem.debrief?.length ?? 0) > 0

  useEffect(() => {
    setOpen(false)
  }, [problem.id, language])

  useEffect(() => {
    if (result?.ok && hasDebrief) {
      setOpen(true)
    }
  }, [result, hasDebrief])

  const isOpen = open && result?.ok === true && hasDebrief

  return {
    isOpen,
    hasDebrief,
    toggle: () => setOpen((prev) => !prev),
    close: () => setOpen(false),
  }
}
