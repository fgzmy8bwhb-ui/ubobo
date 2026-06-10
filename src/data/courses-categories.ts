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
