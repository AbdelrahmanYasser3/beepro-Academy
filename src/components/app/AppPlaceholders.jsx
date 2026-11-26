import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen pt-6 pb-16 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">{t('app.pageNotFound')}</h2>
        <p className="text-secondary-600 dark:text-secondary-400 mb-8">{t('app.pageNotFoundDesc')}</p>
        <a href="/" className="btn btn-primary">{t('app.goHome')}</a>
      </div>
    </div>
  )
}
