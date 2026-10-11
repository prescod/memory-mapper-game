import { useState } from 'react'
import { quotedLiteralFieldError } from './quotedLiteral'
import type { Language } from '../model/types'

interface QuotedLiteralInputProps {
  value: string
  onChange: (value: string) => void
  language: Language
  ariaLabel: string
  placeholder: string
  readOnly?: boolean
}

export function QuotedLiteralInput({
  value,
  onChange,
  language,
  ariaLabel,
  placeholder,
  readOnly = false,
}: QuotedLiteralInputProps) {
  const [error, setError] = useState<string | undefined>()

  const validate = () => setError(quotedLiteralFieldError(value, language))

  return (
    <div className="quoted-literal-field">
      <input
        className={`nodrag mem-input${error ? ' mem-input-invalid' : ''}`}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        readOnly={readOnly}
        onChange={(event) => {
          setError(undefined)
          onChange(event.target.value)
        }}
        onBlur={validate}
      />
      {error && <p className="mem-field-error" role="status">{error}</p>}
    </div>
  )
}
