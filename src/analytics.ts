const GA_MEASUREMENT_ID = 'G-CCLC1GGNZG'

export function initAnalytics(): void {
  if (!import.meta.env.PROD) {
    return
  }

  const dataLayer: unknown[] = []
  window.dataLayer = dataLayer

  const gtag = (...args: unknown[]) => {
    dataLayer.push(args)
  }

  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}
