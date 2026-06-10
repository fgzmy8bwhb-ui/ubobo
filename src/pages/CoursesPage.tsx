import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface GroceryCategory {
  slug: string
  label: string
  image: string
  available: boolean
}

const CATEGORIES: GroceryCategory[] = [
  { slug: 'halles',          label: 'Les halles',                         image: '/categories/halles.jpeg',          available: true },
  { slug: 'fruits-legumes',  label: 'Fruits, légumes',                    image: '/categories/fruits-legumes.jpeg',  available: false },
  { slug: 'charcuterie',     label: 'Charcuterie, traiteur',              image: '/categories/charcuterie.jpeg',     available: false },
  { slug: 'surgeles',        label: 'Surgelés',                           image: '/categories/surgeles.jpeg',        available: false },
  { slug: 'epicerie-salee',  label: 'Épicerie salée',                     image: '/categories/epicerie-salee.jpeg',  available: false },
  { slug: 'vins-bieres',     label: 'Vins, bières, alcools',              image: '/categories/vins-bieres.jpeg',     available: false },
  { slug: 'entretien',       label: 'Entretien, maison',                  image: '/categories/entretien.jpeg',       available: false },
  { slug: 'produits-frais',  label: 'Produits laitiers, œufs, fromages',  image: '/categories/produits-frais.jpeg',  available: false },
  { slug: 'boucherie',       label: 'Boucherie, volaille, poissonnerie',  image: '/categories/boucherie.jpeg',       available: false },
  { slug: 'boulangerie',     label: 'Pain, pâtisserie',                   image: '/categories/boulangerie.jpeg',     available: false },
  { slug: 'epicerie-sucree', label: 'Épicerie sucrée',                    image: '/categories/epicerie-sucree.jpeg', available: false },
  { slug: 'boissons',        label: 'Eaux, jus, soda, thés glacés',       image: '/categories/boissons.jpeg',        available: false },
  { slug: 'hygiene',         label: 'Hygiène, beauté',                    image: '/categories/hygiene.jpeg',         available: false },
  { slug: 'bebe',            label: 'Tout pour bébé',                     image: '/categories/bebe.jpeg',            available: false },
  { slug: 'pharmacie',       label: 'Parapharmacie',                      image: '/categories/pharmacie.jpeg',       available: false },
  { slug: 'animalerie',      label: 'Animalerie',                         image: '/categories/animalerie.jpeg',      available: false },
  { slug: 'puericulture',    label: 'Puériculture',                       image: '/categories/puericulture.jpeg',    available: false },
  { slug: 'monde',           label: 'Produits du monde',                  image: '/categories/monde.jpeg',           available: false },
  { slug: 'regions',         label: 'Produits de nos régions',            image: '/categories/regions.jpeg',         available: false },
  { slug: 'bio',             label: 'Bio et nutrition',                   image: '/categories/bio.jpeg',             available: false },
  { slug: 'electromenager',  label: 'Électroménager, cuisine',            image: '/categories/electromenager.jpeg',  available: false },
  { slug: 'high-tech',       label: 'High-tech, téléphonie',              image: '/categories/high-tech.jpeg',       available: false },
  { slug: 'jardin',          label: 'Jardin, auto, brico',                image: '/categories/jardin.jpeg',          available: false },
  { slug: 'jouets',          label: 'Jouets, jeux vidéo, loisirs',        image: '/categories/jouets.jpeg',          available: false },
  { slug: 'meuble',          label: 'Meuble, linge de maison',            image: '/categories/meuble.jpeg',          available: false },
  { slug: 'mode',            label: 'Mode, bijoux, bagagerie',            image: '/categories/mode.jpeg',            available: false },
  { slug: 'billetterie',     label: 'Billetterie, traiteur, voyage',      image: '/categories/billetterie.jpeg',     available: false },
  { slug: 'promos',          label: 'Promos maison & loisirs',            image: '/categories/promos.jpeg',          available: false },
]

export default function CoursesPage() {
  return (
    <main className="pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-6xl drop-shadow-md">🛒</span>
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow">Courses Arrivée</h1>
              <p className="mt-1 text-white/80">On fait vos courses à l'Auchan de Lège · livré chez vous</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="container-edge pt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-200">Service en cours de construction</p>
            <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-300">
              Les catégories et produits sont ajoutés progressivement. Revenez bientôt !
            </p>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <section className="container-edge pt-6">
        <h2 className="mb-5 text-display">Nos rayons</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
      </section>
    </main>
  )
}

function CategoryCard({ cat }: { cat: GroceryCategory }) {
  const inner = (
    <div className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-line p-4 text-center transition-all duration-200 ${cat.available ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer bg-card' : 'cursor-default bg-card opacity-60'}`}>
      {/* Photo */}
      <div className={`h-16 w-16 overflow-hidden rounded-2xl transition-transform duration-200 ${cat.available ? 'group-hover:scale-105' : ''}`}>
        <img
          src={cat.image}
          alt={cat.label}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Label */}
      <p className="text-xs font-semibold leading-tight text-ink line-clamp-2">{cat.label}</p>

      {/* Coming soon badge */}
      {!cat.available && (
        <span className="absolute top-2 right-2 rounded-full bg-surface-alt px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
          Bientôt
        </span>
      )}
    </div>
  )

  if (!cat.available) return inner

  return (
    <Link to={`/courses/categorie/${cat.slug}`} className="block">
      {inner}
    </Link>
  )
}
