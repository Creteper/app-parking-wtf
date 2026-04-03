# MapComponent 使用指南

## 功能概述

MapComponent 现在支持以下功能：
1. ✅ 标记点点击事件，返回详情（名称、经纬度、完整数据）
2. ✅ 导出 map 实例供外部调用
3. ✅ 画路径功能
4. ✅ 画区域功能
5. ✅ 动态设置地图中心和缩放级别

## 基础使用

### 1. 标记点点击事件

```tsx
import { MapComponent, type MapHandle, type MarkerDetail } from "@/components/map.container";
import { useRef } from "react";

function MyComponent() {
  const handleMarkerClick = (detail: MarkerDetail) => {
    console.log("点击了标记点:");
    console.log("名称:", detail.name);
    console.log("纬度:", detail.latitude);
    console.log("经度:", detail.longitude);
    console.log("完整数据:", detail.data);
  };

  return (
    <MapComponent
      parkingLots={parkingLots}
      onMarkerClick={handleMarkerClick}
    />
  );
}
```

### 2. 使用 Map Ref 控制地图

```tsx
import { MapComponent, type MapHandle } from "@/components/map.container";
import { useRef } from "react";

function MyComponent() {
  const mapRef = useRef<MapHandle>(null);

  const jumpToLocation = () => {
    // 跳转到指定位置
    mapRef.current?.setCenter([45.803, 126.534], 15);
  };

  return (
    <>
      <MapComponent ref={mapRef} parkingLots={parkingLots} />
      <button onClick={jumpToLocation}>跳转到位置</button>
    </>
  );
}
```

### 3. 画路径

```tsx
import { MapComponent, type MapHandle, type PathData } from "@/components/map.container";
import { useRef } from "react";

function MyComponent() {
  const mapRef = useRef<MapHandle>(null);

  const drawRoute = () => {
    const route: PathData = {
      id: "route-1",
      positions: [
        [45.803, 126.534],
        [45.804, 126.535],
        [45.805, 126.536],
      ],
      color: "#ff0000",  // 红色
      weight: 5,         // 线宽
    };

    mapRef.current?.addPath(route);
  };

  const clearAllRoutes = () => {
    mapRef.current?.clearPaths();
  };

  const removeSpecificRoute = () => {
    mapRef.current?.removePath("route-1");
  };

  return (
    <>
      <MapComponent ref={mapRef} parkingLots={parkingLots} />
      <button onClick={drawRoute}>画路径</button>
      <button onClick={clearAllRoutes}>清除所有路径</button>
      <button onClick={removeSpecificRoute}>删除指定路径</button>
    </>
  );
}
```

### 4. 画区域（多边形）

```tsx
import { MapComponent, type MapHandle, type PolygonData } from "@/components/map.container";
import { useRef } from "react";

function MyComponent() {
  const mapRef = useRef<MapHandle>(null);

  const drawArea = () => {
    const area: PolygonData = {
      id: "area-1",
      positions: [
        [45.803, 126.534],
        [45.804, 126.535],
        [45.805, 126.534],
        [45.804, 126.533],
      ],
      color: "#00ff00",        // 边框颜色：绿色
      fillColor: "#00ff00",    // 填充颜色：绿色
      fillOpacity: 0.3,        // 填充透明度
    };

    mapRef.current?.addPolygon(area);
  };

  const clearAllAreas = () => {
    mapRef.current?.clearPolygons();
  };

  const removeSpecificArea = () => {
    mapRef.current?.removePolygon("area-1");
  };

  return (
    <>
      <MapComponent ref={mapRef} parkingLots={parkingLots} />
      <button onClick={drawArea}>画区域</button>
      <button onClick={clearAllAreas}>清除所有区域</button>
      <button onClick={removeSpecificArea}>删除指定区域</button>
    </>
  );
}
```

### 5. 初始化路径和区域

你也可以在组件初始化时就传入路径和区域：

```tsx
import { MapComponent, type PathData, type PolygonData } from "@/components/map.container";

function MyComponent() {
  const initialPaths: PathData[] = [
    {
      id: "route-1",
      positions: [[45.803, 126.534], [45.804, 126.535]],
      color: "#ff0000",
      weight: 3,
    },
  ];

  const initialPolygons: PolygonData[] = [
    {
      id: "area-1",
      positions: [
        [45.803, 126.534],
        [45.804, 126.535],
        [45.805, 126.534],
      ],
      color: "#00ff00",
      fillColor: "#00ff00",
      fillOpacity: 0.3,
    },
  ];

  return (
    <MapComponent
      parkingLots={parkingLots}
      initialPaths={initialPaths}
      initialPolygons={initialPolygons}
    />
  );
}
```

### 6. 获取原生 Leaflet Map 实例

如果你需要使用 Leaflet 的原生 API：

```tsx
import { MapComponent, type MapHandle } from "@/components/map.container";
import { useRef } from "react";

function MyComponent() {
  const mapRef = useRef<MapHandle>(null);

  const useLeafletAPI = () => {
    const leafletMap = mapRef.current?.getMapInstance();
    if (leafletMap) {
      // 使用 Leaflet 原生 API
      console.log("当前缩放级别:", leafletMap.getZoom());
      console.log("当前中心:", leafletMap.getCenter());

      // 添加自定义图层等
      // L.circle([45.803, 126.534], { radius: 500 }).addTo(leafletMap);
    }
  };

  return (
    <>
      <MapComponent ref={mapRef} parkingLots={parkingLots} />
      <button onClick={useLeafletAPI}>使用 Leaflet API</button>
    </>
  );
}
```

## 完整示例

```tsx
import { MapComponent, type MapHandle, type MarkerDetail, type PathData, type PolygonData } from "@/components/map.container";
import { useRef } from "react";

function AdvancedMapExample() {
  const mapRef = useRef<MapHandle>(null);

  // 处理标记点击
  const handleMarkerClick = (detail: MarkerDetail) => {
    console.log(`点击了 ${detail.name}`, detail);

    // 跳转到该标记点
    mapRef.current?.setCenter([detail.latitude, detail.longitude], 16);

    // 画一个围绕该点的区域
    const area: PolygonData = {
      id: `area-${detail.data?.id}`,
      positions: [
        [detail.latitude + 0.001, detail.longitude + 0.001],
        [detail.latitude + 0.001, detail.longitude - 0.001],
        [detail.latitude - 0.001, detail.longitude - 0.001],
        [detail.latitude - 0.001, detail.longitude + 0.001],
      ],
      color: "#ff0000",
      fillColor: "#ff0000",
      fillOpacity: 0.2,
    };
    mapRef.current?.addPolygon(area);
  };

  // 画导航路径
  const drawNavigationRoute = (start: [number, number], end: [number, number]) => {
    const route: PathData = {
      id: "nav-route",
      positions: [start, end],
      color: "#0066ff",
      weight: 4,
    };
    mapRef.current?.addPath(route);
  };

  return (
    <div className="h-screen w-full">
      <MapComponent
        ref={mapRef}
        parkingLots={parkingLots}
        showUserLocation
        onMarkerClick={handleMarkerClick}
      />
    </div>
  );
}

export default AdvancedMapExample;
```

## API 参考

### MapHandle 方法

| 方法 | 参数 | 描述 |
|------|------|------|
| `setCenter` | `(center: [number, number], zoom?: number)` | 设置地图中心和缩放级别 |
| `addPath` | `(path: PathData)` | 添加路径 |
| `removePath` | `(id: string)` | 删除指定路径 |
| `clearPaths` | `()` | 清除所有路径 |
| `addPolygon` | `(polygon: PolygonData)` | 添加区域 |
| `removePolygon` | `(id: string)` | 删除指定区域 |
| `clearPolygons` | `()` | 清除所有区域 |
| `getMapInstance` | `()` | 获取 Leaflet Map 实例 |

### MapComponentProps

| 属性 | 类型 | 描述 |
|------|------|------|
| `isTiles` | `boolean?` | 是否使用瓦片地图 |
| `doubleClickZoom` | `boolean?` | 是否启用双击缩放 |
| `parkingLots` | `ParkingLot[]?` | 停车场列表 |
| `showUserLocation` | `boolean?` | 是否显示用户位置 |
| `customUserLocation` | `[number, number]?` | 自定义用户位置 |
| `onMarkerClick` | `(detail: MarkerDetail) => void` | 标记点击回调 |
| `initialPaths` | `PathData[]?` | 初始路径 |
| `initialPolygons` | `PolygonData[]?` | 初始区域 |

### MarkerDetail

```tsx
interface MarkerDetail {
  name: string;           // 标记点名称
  latitude: number;       // 纬度
  longitude: number;      // 经度
  data?: ParkingLot;     // 完整的停车场数据
}
```

### PathData

```tsx
interface PathData {
  id: string;                    // 唯一标识
  positions: [number, number][]; // 路径坐标点数组
  color?: string;                // 线条颜色（默认 #3388ff）
  weight?: number;               // 线条宽度（默认 3）
}
```

### PolygonData

```tsx
interface PolygonData {
  id: string;                    // 唯一标识
  positions: [number, number][]; // 区域坐标点数组
  color?: string;                // 边框颜色（默认 #3388ff）
  fillColor?: string;            // 填充颜色（默认 #3388ff）
  fillOpacity?: number;          // 填充透明度（默认 0.2）
}
```
