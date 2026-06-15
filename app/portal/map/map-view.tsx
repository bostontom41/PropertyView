'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

// Fix Leaflet's default marker icons (they break under bundlers otherwise)
const propertyIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'property-marker',
})

// Distinct gold icon for IDC offices
const officeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'idc-office-marker', // tinted via CSS
})

const IDC_OFFICES = [
  { name: 'IDC HQ', lat: 34.040017463582906, lng: -84.05490769332587 },
  { name: 'IDC South Carolina', lat: 34.63959441046659, lng: -82.52818594728473 },
  { name: 'IDC Tennessee', lat: 36.15915191679452, lng: -86.77828132635612 },
]

type Property = {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  openCount: number
}

export default function MapView({ properties, height = '70vh', zoom = 7 }: { properties: Property[]; height?: string; zoom?: number }) {
  // Center on the average of all points (offices + properties), fallback to IDC HQ
  const allPts = [
    ...IDC_OFFICES.map((o) => [o.lat, o.lng] as [number, number]),
    ...properties.map((p) => [p.latitude, p.longitude] as [number, number]),
  ]
  const center: [number, number] = allPts.length
    ? [allPts.reduce((s, p) => s + p[0], 0) / allPts.length, allPts.reduce((s, p) => s + p[1], 0) / allPts.length]
    : [34.04, -84.05]

  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: '0.75rem' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {IDC_OFFICES.map((o) => (
        <Marker key={o.name} position={[o.lat, o.lng]} icon={officeIcon}>
          <Popup>
            <strong>{o.name}</strong>
            <br />
            <span style={{ color: '#888' }}>IDC Office</span>
          </Popup>
        </Marker>
      ))}

      {properties.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={propertyIcon}>
          <Popup>
            <strong>{p.name}</strong>
            <br />
            <span style={{ color: '#888' }}>{p.address}</span>
            <br />
            {p.openCount} open {p.openCount === 1 ? 'issue' : 'issues'}
            <br />
            <Link href={`/portal/properties/${p.id}`} style={{ color: '#002144' }}>View property →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}