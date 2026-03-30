import { MapContainer, TileLayer } from "react-leaflet";
import { Marker } from "react-leaflet";
import { Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TILES_BASE_URL } from "@/lib/env";
export interface MapComponentProps {
  isTiles?: boolean;
  doubleClickZoom?: boolean;
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
      <Marker position={[45.80357801199185, 126.53491329689206]}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  );
}
