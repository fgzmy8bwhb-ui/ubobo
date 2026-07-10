export interface CoursesSubCategory {
  slug: string
  label: string
  image: string
}

export interface CoursesCategoryData {
  title: string
  image: string
  subcategories: CoursesSubCategory[]
}

// Images locales dans /public/categories/
export const AUCHAN_ICON_BY_SLUG: Record<string, string> = {
  'les-halles-d-auchan':                  '/categories/halles.jpeg',
  'oeufs-produits-laitiers':              '/categories/produits-frais.jpeg',
  'fruits-legumes':                       '/categories/fruits-legumes.jpeg',
  'boucherie-volaille-poissonnerie':      '/categories/boucherie.jpeg',
  'charcuterie-traiteur-pain':            '/categories/charcuterie.jpeg',
  'pain-patisserie':                      '/categories/boulangerie.jpeg',
  'surgeles':                             '/categories/surgeles.jpeg',
  'epicerie-sucree':                      '/categories/epicerie-sucree.jpeg',
  'epicerie-salee':                       '/categories/epicerie-salee.jpeg',
  'boissons-sans-alcool':                 '/categories/boissons.jpeg',
  'vins-bieres-alcool':                   '/categories/vins-bieres.jpeg',
  'hygiene-beaute':                       '/categories/hygiene.jpeg',
  'hygiene-beaute-parapharmacie':         '/categories/hygiene.jpeg',
  'entretien-maison':                     '/categories/entretien.jpeg',
  'bebe':                                 '/categories/bebe.jpeg',
  'animalerie':                           '/categories/animalerie.jpeg',
  'produits-de-nos-regions-et-du-monde':  '/categories/monde.jpeg',
  'produits-de-nos-regions':              '/categories/regions.jpeg',
  'bio-et-nutrition':                     '/categories/bio.jpeg',
}

export const COURSES_CATEGORIES: Record<string, CoursesCategoryData> = {
  halles: {
    title: "Les halles d'Auchan",
    image: '/categories/halles.jpeg',
    subcategories: [
      { slug: 'boucher',     label: 'Mon boucher',                  image: '/categories/halles/boucher.jpeg'     },
      { slug: 'boulanger',   label: 'Mon boulanger, mon pâtissier', image: '/categories/halles/boulanger.jpeg'   },
      { slug: 'charcutier',  label: 'Mon charcutier',               image: '/categories/halles/charcutier.jpeg'  },
      { slug: 'fromager',    label: 'Mon fromager',                 image: '/categories/halles/fromager.jpeg'    },
      { slug: 'poissonnier', label: 'Mon poissonnier',              image: '/categories/halles/poissonnier.jpeg' },
      { slug: 'primeur',     label: 'Mon primeur',                  image: '/categories/halles/primeur.jpeg'     },
      { slug: 'traiteur',    label: 'Mon traiteur, ma rôtisserie',  image: '/categories/halles/traiteur.jpeg'    },
    ],
  },
}
