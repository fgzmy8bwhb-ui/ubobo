import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://ubobo.fr'
const DEFAULT_IMAGE = `${SITE_URL}/tiles/alice.jpg`

interface SeoProps {
  title: string
  description: string
  path?: string
  image?: string
}

export default function Seo({ title, description, path = '/', image = DEFAULT_IMAGE }: SeoProps) {
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
    </Helmet>
  )
}
