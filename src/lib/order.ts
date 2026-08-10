export type ServiceMode = 'delivery' | 'pickup'

export type CartLine = {
  id: string
  name: string
  price: number
  quantity: number
  available?: boolean
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
