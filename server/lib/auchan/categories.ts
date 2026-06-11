export interface AuchanCategory {
  slug: string
  name: string
  url: string
}

// "Mes courses" categories from Auchan navigation (extracted from live HTML)
// Used as fallback when DB is empty. Slugs match DB AuchanCategory.slug.
export const AUCHAN_CATEGORIES: AuchanCategory[] = [
  { slug: 'les-halles-d-auchan',              name: "Les halles d'Auchan",                    url: 'https://www.auchan.fr/les-halles-d-auchan/ca-b202209050930' },
  { slug: 'oeufs-produits-laitiers',          name: 'Produits laitiers, oeufs, fromages',     url: 'https://www.auchan.fr/oeufs-produits-laitiers/ca-n01' },
  { slug: 'fruits-legumes',                   name: 'Fruits, légumes',                         url: 'https://www.auchan.fr/fruits-legumes/ca-n03' },
  { slug: 'boucherie-volaille-poissonnerie',   name: 'Boucherie, volaille, poissonnerie',       url: 'https://www.auchan.fr/boucherie-volaille-poissonnerie/ca-n02' },
  { slug: 'charcuterie-traiteur-pain',         name: 'Charcuterie, traiteur',                  url: 'https://www.auchan.fr/charcuterie-traiteur-pain/ca-n12' },
  { slug: 'pain-patisserie',                  name: 'Pain, pâtisserie',                        url: 'https://www.auchan.fr/pain-patisserie/ca-n1203' },
  { slug: 'surgeles',                         name: 'Surgelés',                                url: 'https://www.auchan.fr/surgeles/ca-n04' },
  { slug: 'epicerie-sucree',                  name: 'Epicerie sucrée',                         url: 'https://www.auchan.fr/epicerie-sucree/ca-n05' },
  { slug: 'epicerie-salee',                   name: 'Epicerie salée',                          url: 'https://www.auchan.fr/epicerie-salee/ca-n06' },
  { slug: 'boissons-sans-alcool',             name: 'Eaux, jus, soda, thés glacés',            url: 'https://www.auchan.fr/boissons-sans-alcool/ca-n13' },
  { slug: 'vins-bieres-alcool',               name: 'Vins, bières, alcools',                   url: 'https://www.auchan.fr/vins-bieres-alcool/ca-n07' },
  { slug: 'hygiene-beaute-parapharmacie',      name: 'Hygiène, beauté',                         url: 'https://www.auchan.fr/hygiene-beaute-parapharmacie/ca-n09' },
  { slug: 'entretien-maison',                 name: 'Entretien, accessoires de la maison',     url: 'https://www.auchan.fr/entretien-maison/ca-n10' },
  { slug: 'bebe',                             name: 'Tout pour bébé',                          url: 'https://www.auchan.fr/bebe/ca-n08' },
  { slug: 'animalerie',                       name: 'Animalerie',                              url: 'https://www.auchan.fr/animalerie/ca-n11' },
  { slug: 'produits-de-nos-regions-et-du-monde', name: 'Produits du monde',                   url: 'https://www.auchan.fr/produits-de-nos-regions-et-du-monde/ca-b08' },
  { slug: 'produits-de-nos-regions',          name: 'Produits de nos régions',                 url: 'https://www.auchan.fr/produits-de-nos-regions/ca-b202406051513' },
  { slug: 'bio-et-nutrition',                 name: 'Bio et nutrition',                        url: 'https://www.auchan.fr/bio-et-nutrition/ca-b04' },
]
