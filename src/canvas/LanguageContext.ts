import { createContext, useContext } from 'react'
import type { Language } from '../model/types'

/** The language the diagram is drawn for, which decides how values and containers are spelled. */
export const LanguageContext = createContext<Language>('javascript')

export function useLanguage(): Language {
  return useContext(LanguageContext)
}
