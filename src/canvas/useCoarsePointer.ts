import { useEffect, useState } from 'react'

/** True when the primary pointer is coarse (touch), for wider diagram hit targets. */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    const media = matchMedia('(pointer: coarse)')
    const update = () => setCoarse(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return coarse
}
