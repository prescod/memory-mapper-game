import { LANGUAGES, LANGUAGE_LABELS, type Language } from '../model/types'
import { useAppStore } from '../store/useAppStore'

interface LanguageToggleProps {
  /** Lays every language out as a visible button instead of a compact drop-down. */
  prominent?: boolean
}

export function LanguageToggle({ prominent = false }: LanguageToggleProps) {
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  if (prominent) {
    return (
      <div className="segmented-control" role="group" aria-label="Language">
        {LANGUAGES.map((option) => (
          <button
            key={option}
            type="button"
            className={`segmented-option${option === language ? ' active' : ''}`}
            aria-pressed={option === language}
            onClick={() => setLanguage(option)}
          >
            {LANGUAGE_LABELS[option]}
          </button>
        ))}
      </div>
    )
  }

  return (
    <select
      className="language-select"
      aria-label="Language"
      value={language}
      onChange={(event) => setLanguage(event.target.value as Language)}
    >
      {LANGUAGES.map((option) => (
        <option key={option} value={option}>
          {LANGUAGE_LABELS[option]}
        </option>
      ))}
    </select>
  )
}
