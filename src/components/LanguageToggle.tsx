import { LANGUAGES, LANGUAGE_LABELS } from '../model/types'
import { useAppStore } from '../store/useAppStore'

export function LanguageToggle() {
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

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
