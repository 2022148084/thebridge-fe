import { createFileRoute } from "@tanstack/react-router"
import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps"

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

function MapPage() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

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
    <div className="h-[calc(100vh-12rem)] w-full overflow-hidden rounded-md border">
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={{ lat: 37.5665, lng: 126.978 }}
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI={false}
        />
      </APIProvider>
    </div>
  )
}
