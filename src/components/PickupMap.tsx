import { useEffect, useRef } from 'react'
import L, { type Map as LeafletMap, type Marker } from 'leaflet'
import { krasnodarCenter, pickupLocations } from '../data/locations'

const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function markerIcon(index: number, selected: boolean) {
  return L.divIcon({
    className: `pm-map-pin${selected ? ' selected' : ''}`,
    html: `<span>${index + 1}</span>`,
    iconSize: selected ? [44, 44] : [34, 34],
    iconAnchor: selected ? [22, 22] : [17, 17],
  })
}

export function PickupMap({ active, onActive }: { active: number; onActive: (index: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const onActiveRef = useRef(onActive)

  useEffect(() => { onActiveRef.current = onActive }, [onActive])

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      center: L.latLng(krasnodarCenter[0], krasnodarCenter[1]),
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true,
    })
    map.attributionControl.setPrefix(false)
    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 18,
    }).addTo(map)
    const markers = pickupLocations.map((location, index) => {
      const marker = L.marker(L.latLng(location.coordinates[0], location.coordinates[1]), {
        icon: markerIcon(index, false),
        keyboard: true,
        title: location.address,
        alt: `Точка ${index + 1}: ${location.address}`,
      }).addTo(map)
      marker.bindTooltip(location.address, { direction: 'top', offset: [0, -15] })
      marker.on('click', () => onActiveRef.current(index))
      return marker
    })
    mapRef.current = map
    markersRef.current = markers
    requestAnimationFrame(() => map.invalidateSize())
    return () => {
      markersRef.current = []
      mapRef.current = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    markersRef.current.forEach((marker, index) => marker.setIcon(markerIcon(index, active === index)))
    const location = pickupLocations[active]
    const map = mapRef.current
    if (!location || !map) return
    map.flyTo(L.latLng(location.coordinates[0], location.coordinates[1]), Math.max(map.getZoom(), 14), { animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, duration: .45 })
    markersRef.current[active]?.openTooltip()
  }, [active])

  return <div ref={containerRef} className="pickup-map" role="application" aria-label={`Интерактивная карта: ${pickupLocations.length} кулинарий «Патрик & Мари»`} />
}
