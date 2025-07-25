"use client"

import { useEffect, useState } from "react"
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"

export const Polygon = (props: google.maps.PolygonOptions) => {
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null)
  const map = useMap()

  useEffect(() => {
    if (map) {
      if (polygon) {
        polygon.setOptions(props)
      } else {
        setPolygon(new google.maps.Polygon(props))
      }
    }
  }, [map, props, polygon])

  useEffect(() => {
    if (polygon) {
      polygon.setMap(map)
    }

    return () => {
      if (polygon) {
        polygon.setMap(null)
      }
    }
  }, [map, polygon])

  return null
}
