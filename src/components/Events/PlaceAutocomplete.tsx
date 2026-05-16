import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type SelectedPlace = {
  place_name: string
  city: string
  lat: number
  lng: number
}

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: SelectedPlace) => void
  placeholder?: string
  defaultValue?: string
  className?: string
}

export function PlaceAutocomplete({
  onPlaceSelect,
  placeholder,
  defaultValue,
  className,
}: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const places = useMapsLibrary("places")
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!places || !inputRef.current) return
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["name", "geometry.location", "address_components"],
      componentRestrictions: { country: "kr" },
    })
    setAutocomplete(ac)
    return () => {
      google.maps.event.clearInstanceListeners(ac)
    }
  }, [places])

  useEffect(() => {
    if (!autocomplete) return
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (!place.geometry?.location) return
      const cityComp = place.address_components?.find((c) =>
        c.types.includes("administrative_area_level_1"),
      )
      onPlaceSelect({
        place_name: place.name ?? "",
        city: cityComp?.long_name ?? "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      })
    })
    return () => listener.remove()
  }, [autocomplete, onPlaceSelect])

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={!places}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
    />
  )
}
