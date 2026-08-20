import { krasnodarCenter, type PickupLocation } from '../data/locations.ts'

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim()

export function filterPickupLocations(locations: PickupLocation[], query: string) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return locations
  return locations.filter((location) => normalize([
    location.address,
    location.fullAddress,
    location.city,
    location.district,
  ].join(' ')).includes(normalizedQuery))
}

export function sortPickupLocationsFromCenter(locations: PickupLocation[]) {
  const latitudeFactor = Math.cos(krasnodarCenter[0] * Math.PI / 180)
  return [...locations].sort((left, right) => {
    const distance = (location: PickupLocation) => {
      const latitude = location.coordinates[0] - krasnodarCenter[0]
      const longitude = (location.coordinates[1] - krasnodarCenter[1]) * latitudeFactor
      return latitude * latitude + longitude * longitude
    }
    return distance(left) - distance(right) || left.address.localeCompare(right.address, 'ru')
  })
}
