export function ageYearsFromDob(dob, onDate = new Date()) {
  if (!dob) return null
  const birth = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  let years = onDate.getFullYear() - birth.getFullYear()
  const monthDiff = onDate.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && onDate.getDate() < birth.getDate())) {
    years -= 1
  }
  return years < 0 ? null : years
}

export function formatSex(gender) {
  if (!gender) return null
  const value = String(gender).toUpperCase()
  if (value === 'MALE') return 'Male'
  if (value === 'FEMALE') return 'Female'
  return gender
}

export function formatAge(ageYears) {
  if (ageYears == null || ageYears === '') return null
  return `${ageYears} years`
}

export function displayAge(person) {
  if (!person) return null
  return formatAge(person.ageYears ?? ageYearsFromDob(person.dateOfBirth))
}
