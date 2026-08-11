export type ServiceMode = 'delivery' | 'pickup'

export type CartLine = {
  id: string
  name: string
  price: number
  quantity: number
  available?: boolean
}

export type ConfirmedOrder = {
  id: string
  mode: ServiceMode
  location: string
  slot: string
  lines: CartLine[]
  amount: number
  status: 'Принят'
}

export type CakeRequest = {
  size: string
  design: string
  status: 'Сохранена'
}

export const total = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + line.price * line.quantity, 0)

export const addLine = (lines: CartLine[], next: Omit<CartLine, 'quantity'>): CartLine[] => {
  const existing = lines.find((line) => line.id === next.id)
  if (existing) {
    return lines.map((line) => line.id === next.id ? { ...line, quantity: line.quantity + 1 } : line)
  }
  return [...lines, { ...next, quantity: 1 }]
}

export const changeQuantity = (lines: CartLine[], id: string, delta: number): CartLine[] =>
  lines
    .map((line) => line.id === id ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line)
    .filter((line) => line.quantity > 0)

export const reconcileRepeat = (lines: CartLine[], currentPrices: Record<string, number>) =>
  lines.map((line) => ({
    ...line,
    price: currentPrices[line.id] ?? line.price,
    available: currentPrices[line.id] !== undefined,
  }))

export const createConfirmedOrder = (
  id: string,
  mode: ServiceMode,
  location: string,
  slot: string,
  lines: CartLine[],
): ConfirmedOrder => ({
  id,
  mode,
  location,
  slot,
  lines: structuredClone(lines),
  amount: total(lines),
  status: 'Принят',
})

export const createCakeRequest = (size: string, design: string): CakeRequest => ({
  size,
  design,
  status: 'Сохранена',
})

export const toggleFavoriteId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]

export const filterLocations = (locations: string[], query: string) => {
  const normalized = query.trim().toLocaleLowerCase('ru-RU')
  return normalized
    ? locations.filter((location) => location.toLocaleLowerCase('ru-RU').includes(normalized))
    : locations
}
