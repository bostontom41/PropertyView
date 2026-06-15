'use client'

import nextDynamic from 'next/dynamic'

const MapView = nextDynamic(() => import('./map-view'), { ssr: false })

export default function MapLoader({ properties, height, zoom }: { properties: any[]; height?: string; zoom?: number }) {
  return <MapView properties={properties} height={height} zoom={zoom} />
}