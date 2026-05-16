import { createFileRoute } from "@tanstack/react-router"
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps"
import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/_layout/map")({
  component: MapPage,
  head: () => ({
    meta: [
      {
        title: "Map - Hackathon Template",
      },
    ],
  }),
})

const SEOUL = { lat: 37.5665, lng: 126.978 }

type LatLng = { lat: number; lng: number }

function MapPage() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const [pos, setPos] = useState<LatLng | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Something went wrong!", {
        description: "이 브라우저는 위치 정보를 지원하지 않습니다.",
      })
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude })
        setLoading(false)
      },
      (err) => {
        toast.error("Something went wrong!", {
          description: `위치를 가져오지 못했어요: ${err.message}`,
        })
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  if (!apiKey) {
    return (
      <div>
        <h1 className="text-2xl">Map</h1>
        <p className="text-muted-foreground mt-2">
          VITE_GOOGLE_MAPS_API_KEY 환경변수를 설정해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-12rem)] w-full overflow-hidden rounded-md border">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={SEOUL}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={false}
          fullscreenControl={false}
          mapTypeControl={false}
          rotateControl={false}
          isFractionalZoomEnabled
          styles={[{ featureType: "poi", stylers: [{ visibility: "off" }] }]}
        >
          {pos && (
            <Marker
              position={pos}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          )}
          <FitToUser pos={pos} />
        </GoogleMap>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 z-10 shadow-md"
          onClick={fetchLocation}
          disabled={loading}
          aria-label="현재 위치 새로고침"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </APIProvider>
    </div>
  )
}

const VIEW_RADIUS_M = 3000

function FitToUser({ pos }: { pos: LatLng | null }) {
  const map = useMap()
  const hasFitInitial = useRef(false)
  useEffect(() => {
    if (!pos || !map) return
    if (hasFitInitial.current) {
      map.panTo(pos)
      return
    }
    hasFitInitial.current = true
    const doFit = () => {
      const div = map.getDiv()
      const longerPx = Math.max(div.offsetWidth, div.offsetHeight)
      if (!longerPx) return
      const earthAtLat = 40075016.686 * Math.cos((pos.lat * Math.PI) / 180)
      const zoom = Math.log2((earthAtLat * longerPx) / (512 * VIEW_RADIUS_M))
      map.setCenter(pos)
      map.setZoom(zoom)
    }
    if (map.getBounds()) {
      doFit()
    } else {
      google.maps.event.addListenerOnce(map, "idle", doFit)
    }
  }, [pos, map])
  return null
}
