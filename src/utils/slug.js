// Slug consistente (sem acentos) usado tanto na rota dinamica dos
// empreendimentos como nos links das listagens - assim batem sempre certo.
export function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // remove diacriticos (acentos)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
