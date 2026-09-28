export const FOUNDATION_YEAR = 2012;

/**
 * Calculates the company's years of experience dynamically based on foundation year (2012).
 * @param {number} [currentYear] - Optional explicit year (defaults to current calendar year)
 * @returns {number}
 */
export function getYearsOfExperience(currentYear = new Date().getFullYear()) {
  return currentYear - FOUNDATION_YEAR;
}

/**
 * Generates the dynamic homepage SEO title.
 * Example outputs:
 * 2026 -> "AARAA Infrastructure: 14+ Years of Construction, EPC & Engineering Excellence"
 * 2027 -> "AARAA Infrastructure: 15+ Years of Construction, EPC & Engineering Excellence"
 * @param {number} [currentYear] - Optional explicit year
 * @returns {string}
 */
export function getHomepageSeoTitle(currentYear = new Date().getFullYear()) {
  const yearsOfExperience = getYearsOfExperience(currentYear);
  return `AARAA Infrastructure: ${yearsOfExperience}+ Years of Construction, EPC & Engineering Excellence`;
}
