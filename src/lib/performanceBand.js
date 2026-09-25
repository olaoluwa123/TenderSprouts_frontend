export function toPerformanceBand(total) {
  if (total == null || total === '' || Number.isNaN(Number(total))) return null
  const score = Number(total)
  if (score >= 90) return 'EXCELLENT'
  if (score >= 80) return 'VERY GOOD'
  if (score >= 70) return 'GOOD'
  if (score >= 60) return 'SATISFACTORY'
  if (score >= 50) return 'AVERAGE'
  return 'BELOW AVERAGE'
}

export const BAND_CLASS = {
  EXCELLENT: 'bg-[#7CB342] text-white',
  'VERY GOOD': 'bg-[#C6FF00] text-black',
  GOOD: 'bg-[#F6E04D] text-black',
  SATISFACTORY: 'bg-[#FFB74D] text-black',
  AVERAGE: 'bg-[#EF5350] text-white',
  'BELOW AVERAGE': 'bg-[#C62828] text-white',
}

export function bandClassName(band) {
  return BAND_CLASS[band] ?? 'bg-brand-50 text-brand-800'
}
