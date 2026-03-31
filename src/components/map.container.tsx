import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILES_BASE_URL } from "@/lib/env";
import type { ParkingLot } from "@/lib/api";

const locationIcon = L.icon({
  iconUrl: "/location/location.svg",
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -40],
});

function CustomMarker({ lot }: { lot: ParkingLot }) {
  // 后端文档里 latitude/longitude 是可选字段，这里做兼容处理
  const latRaw = (lot as any).latitude ?? (lot as any).lat;
  const lngRaw = (lot as any).longitude ?? (lot as any).lng;
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return (
    <Marker position={[lat, lng]} icon={locationIcon}>
      <Popup>{lot.parking_lot_name ?? lot.id}</Popup>
    </Marker>
  );
}

export interface MapComponentProps {
  isTiles?: boolean;
  doubleClickZoom?: boolean;
  parkingLots?: ParkingLot[];
}

export function MapComponent(
  props: MapComponentProps = { isTiles: true, doubleClickZoom: true },
) {
  return (
    <MapContainer
      className="w-full h-full"
      center={[45.80357801199185, 126.53491329689206]}
      zoom={13}
      // 隐藏 Leaflet 默认的“层级(缩放) +/- 控件”
      zoomControl={false}
      doubleClickZoom={props.doubleClickZoom}
    >
      <TileLayer
        attribution="&copy; 智慧社区地图 ©2026"
        url={
          props.isTiles
            ? `${TILES_BASE_URL}/tiles/{z}/{x}/{y}`
            : `${TILES_BASE_URL}/w_tiles/{z}/{x}/{y}`
        }
      />
      {props.parkingLots?.map((lot) => (
        <CustomMarker key={lot.id} lot={lot} />
      ))}
    </MapContainer>
  );
}
