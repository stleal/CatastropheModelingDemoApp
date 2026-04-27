import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { divIcon, type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DamageAssessmentDataset } from './damageAssessment.types'
import {
  getTrajectoryModelKey,
  trajectoryModelOptions,
  type TrajectoryModelKey,
} from '../../data/sampleDamageAssessment'

type ImpactZoneMapProps = {
  dataset: DamageAssessmentDataset
  visibleDatasets: DamageAssessmentDataset[]
}

type MajorImpactZone = {
  zip: string
  city: string
  lat: number
  lng: number
  models: string[]
  maxEstimatedDamageUsd: number
  maxDamageScore: number
  maxPeakWindMph: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getModelLabel(modelKey: TrajectoryModelKey) {
  return trajectoryModelOptions.find((option) => option.key === modelKey)?.label ?? modelKey
}

function createMajorImpactPin() {
  return divIcon({
    className: 'impact-zone-pin',
    html: '<div class="impact-zone-pin-marker"><span>M</span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  })
}

function ImpactZoneMap({ dataset, visibleDatasets }: ImpactZoneMapProps) {
  const majorImpactZones = useMemo<MajorImpactZone[]>(() => {
    return dataset.zips.flatMap((zone) => {
      const matchingImpacts = visibleDatasets.flatMap((resultSet) => {
        const impact = resultSet.impacts.find(
          (item) => item.zip === zone.zip && item.severityBand === 'major',
        )

        if (!impact) {
          return []
        }

        return [
          {
            modelLabel: getModelLabel(getTrajectoryModelKey(resultSet.id)),
            estimatedDamageUsd: impact.estimatedDamageUsd,
            damageScore: impact.damageScore,
            peakWindMph: impact.peakWindMph,
          },
        ]
      })

      if (matchingImpacts.length === 0) {
        return []
      }

      return [
        {
          zip: zone.zip,
          city: zone.city,
          lat: zone.lat,
          lng: zone.lng,
          models: matchingImpacts.map((impact) => impact.modelLabel),
          maxEstimatedDamageUsd: Math.max(
            ...matchingImpacts.map((impact) => impact.estimatedDamageUsd),
          ),
          maxDamageScore: Math.max(...matchingImpacts.map((impact) => impact.damageScore)),
          maxPeakWindMph: Math.max(...matchingImpacts.map((impact) => impact.peakWindMph)),
        },
      ]
    })
  }, [dataset.zips, visibleDatasets])

  const mapCenter = useMemo<LatLngTuple>(() => {
    const source = majorImpactZones.length > 0 ? majorImpactZones : dataset.zips
    const totalLat = source.reduce((sum, zone) => sum + zone.lat, 0)
    const totalLng = source.reduce((sum, zone) => sum + zone.lng, 0)

    return [totalLat / source.length, totalLng / source.length]
  }, [dataset.zips, majorImpactZones])

  if (majorImpactZones.length === 0) {
    return (
      <div className="impact-zone-map-empty">
        <p>No major impact zones are expected for the currently visible result sets.</p>
      </div>
    )
  }

  const markerIcon = createMajorImpactPin()

  return (
    <div className="impact-zone-map-stack">
      <div className="impact-zone-map-frame">
        <MapContainer
          center={mapCenter}
          zoom={8}
          scrollWheelZoom
          className="impact-zone-map"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {majorImpactZones.map((zone) => (
            <Marker key={zone.zip} position={[zone.lat, zone.lng]} icon={markerIcon}>
              <Popup>
                <div className="impact-zone-popup">
                  <strong>
                    {zone.city} ({zone.zip})
                  </strong>
                  <p>Major impact expected in {zone.models.join(', ')}.</p>
                  <p>Peak modeled damage: {formatCurrency(zone.maxEstimatedDamageUsd)}</p>
                  <p>Peak wind: {zone.maxPeakWindMph} mph</p>
                  <p>Highest damage score: {(zone.maxDamageScore * 100).toFixed(0)}%</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="impact-zone-map-note">
        Pins mark ZIP zones that reach the major severity band in any currently visible model.
      </p>
    </div>
  )
}

export default ImpactZoneMap