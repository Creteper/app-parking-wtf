import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Polygon,
  useMap,
} from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { TILES_BASE_URL } from "@/lib/env";
import type { ParkingLot } from "@/lib/api";
import { createUserLocationIcon } from "./UserLocationIcon";

const locationIcon = L.icon({
  iconUrl: "/location/location.svg",
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -40],
});

// 标记点详情接口
export interface MarkerDetail {
  name: string;
  latitude: number;
  longitude: number;
  data?: ParkingLot;
}

interface CustomMarkerProps {
  lot: ParkingLot;
  onMarkerClick?: (detail: MarkerDetail) => void;
}

function CustomMarker({ lot, onMarkerClick }: CustomMarkerProps) {
  // 后端文档里 latitude/longitude 是可选字段，这里做兼容处理
  const latRaw = (lot as any).latitude ?? (lot as any).lat;
  const lngRaw = (lot as any).longitude ?? (lot as any).lng;
  const lat = typeof latRaw === "number" ? latRaw : Number(latRaw);
  const lng = typeof lngRaw === "number" ? lngRaw : Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick({
        name: lot.parking_lot_name ?? lot.id?.toString() ?? "未知停车场",
        latitude: lat,
        longitude: lng,
        data: lot,
      });
    }
  };

  return (
    <Marker
      position={[lat, lng]}
      icon={locationIcon}
      eventHandlers={{
        click: handleClick,
      }}
    >
      <Popup>{lot.parking_lot_name ?? lot.id}</Popup>
    </Marker>
  );
}

// 用户位置标记组件
function UserLocationMarker({ position }: { position: [number, number] }) {
  const userIcon = createUserLocationIcon();

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>您的当前位置</Popup>
    </Marker>
  );
}

// 路径数据接口
export interface PathData {
  id: string;
  positions: [number, number][];
  color?: string;
  weight?: number;
}

// 区域数据接口
export interface PolygonData {
  id: string;
  positions: [number, number][];
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
}

// Map 控制方法接口
export interface MapHandle {
  setCenter: (center: [number, number], zoom?: number) => void;
  setZoom: (zoom: number) => void;
  addPath: (path: PathData) => void;
  updatePath: (id: string, positions: [number, number][]) => void;
  removePath: (id: string) => void;
  clearPaths: () => void;
  addPolygon: (polygon: PolygonData) => void;
  removePolygon: (id: string) => void;
  clearPolygons: () => void;
  getMapInstance: () => L.Map | null;
}

export interface MapComponentProps {
  isTiles?: boolean;
  doubleClickZoom?: boolean;
  parkingLots?: ParkingLot[];
  showUserLocation?: boolean;
  customUserLocation?: [number, number];
  onMarkerClick?: (detail: MarkerDetail) => void;
  initialPaths?: PathData[];
  initialPolygons?: PolygonData[];
}

// Map 控制组件
function MapController({
  mapHandle,
}: {
  mapHandle: React.MutableRefObject<MapHandle>;
}) {
  const map = useMap();

  useImperativeHandle(
    mapHandle,
    () => ({
      setCenter: (center: [number, number], zoom?: number) => {
        if (zoom !== undefined) {
          map.setView(center, zoom);
        } else {
          map.setView(center);
        }
      },
      setZoom: (zoom: number) => {
        map.setZoom(zoom);
      },
      addPath: () => {},
      updatePath: () => {},
      removePath: () => {},
      clearPaths: () => {},
      addPolygon: () => {},
      removePolygon: () => {},
      clearPolygons: () => {},
      getMapInstance: () => map,
    }),
    [map],
  );

  return null;
}

export const MapComponent = forwardRef<MapHandle, MapComponentProps>(
  function MapComponent(
    props: MapComponentProps = { isTiles: true, doubleClickZoom: true },
    ref,
  ) {
    const [userLocation, setUserLocation] = useState<[number, number] | null>(
      null,
    );
    const [paths, setPaths] = useState<PathData[]>(
      props.initialPaths ?? [],
    );
    const [polygons, setPolygons] = useState<PolygonData[]>(
      props.initialPolygons ?? [],
    );
    const mapHandleRef = React.useRef<MapHandle>({} as MapHandle);

    // 获取用户位置
    useEffect(() => {
      if (!props.showUserLocation) return;

      if (props.customUserLocation) {
        setUserLocation(props.customUserLocation);
        return;
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([latitude, longitude]);
          },
          (error) => {
            console.error("获取用户位置失败:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
        );
      } else {
        console.error("浏览器不支持地理位置API");
      }
    }, [props.showUserLocation, props.customUserLocation]);

    // 响应 initialPaths 变化
    useEffect(() => {
      if (props.initialPaths && props.initialPaths.length > 0) {
        setPaths(props.initialPaths);
      }
    }, [props.initialPaths]);

    // 响应 initialPolygons 变化
    useEffect(() => {
      if (props.initialPolygons && props.initialPolygons.length > 0) {
        setPolygons(props.initialPolygons);
      }
    }, [props.initialPolygons]);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        setCenter: (center: [number, number], zoom?: number) => {
          mapHandleRef.current.setCenter(center, zoom);
        },
        setZoom: (zoom: number) => {
          mapHandleRef.current.setZoom(zoom);
        },
        addPath: (path: PathData) => {
          setPaths((prev) => [...prev, path]);
        },
        updatePath: (id: string, positions: [number, number][]) => {
          setPaths((prev) =>
            prev.map((p) => (p.id === id ? { ...p, positions } : p)),
          );
        },
        removePath: (id: string) => {
          setPaths((prev) => prev.filter((p) => p.id !== id));
        },
        clearPaths: () => {
          setPaths([]);
        },
        addPolygon: (polygon: PolygonData) => {
          setPolygons((prev) => [...prev, polygon]);
        },
        removePolygon: (id: string) => {
          setPolygons((prev) => prev.filter((p) => p.id !== id));
        },
        clearPolygons: () => {
          setPolygons([]);
        },
        getMapInstance: () => {
          return mapHandleRef.current.getMapInstance();
        },
      }),
      [],
    );

    return (
      <MapContainer
        className="w-full h-full"
        center={[45.80357801199185, 126.53491329689206]}
        zoom={15}
        zoomControl={false}
        doubleClickZoom={props.doubleClickZoom}
      >
        <MapController mapHandle={mapHandleRef} />
        <TileLayer
          attribution="&copy; 智慧社区地图 ©2026"
          url={
            props.isTiles
              ? `${TILES_BASE_URL}/tiles/{z}/{x}/{y}`
              : `${TILES_BASE_URL}/w_tiles/{z}/{x}/{y}`
          }
        />
        {props.parkingLots?.map((lot) => (
          <CustomMarker
            key={lot.id}
            lot={lot}
            onMarkerClick={props.onMarkerClick}
          />
        ))}
        {userLocation && <UserLocationMarker position={userLocation} />}

        {/* 渲染路径 */}
        {paths.map((path) => (
          <Polyline
            key={path.id}
            positions={path.positions}
            pathOptions={{
              color: path.color ?? "#3B82F6",
              weight: path.weight ?? 5,
            }}
          />
        ))}

        {/* 渲染区域 */}
        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            positions={polygon.positions}
            pathOptions={{
              color: polygon.color ?? "#3388ff",
              fillColor: polygon.fillColor ?? "#3388ff",
              fillOpacity: polygon.fillOpacity ?? 0.2,
            }}
          />
        ))}
      </MapContainer>
    );
  },
);
