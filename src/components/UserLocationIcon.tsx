import { renderToStaticMarkup } from "react-dom/server";
import * as L from "leaflet";

// 用户位置SVG图标组件
export function UserLocationSvg() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外圈脉冲效果 */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="#3B82F6"
        fillOpacity="0.2"
      >
        <animate
          attributeName="r"
          from="15"
          to="20"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.6"
          to="0"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* 中圈 */}
      <circle
        cx="20"
        cy="20"
        r="12"
        fill="#3B82F6"
        fillOpacity="0.3"
      />

      {/* 内圈 - 实心蓝点 */}
      <circle
        cx="20"
        cy="20"
        r="8"
        fill="#3B82F6"
      />

      {/* 中心白点 */}
      <circle
        cx="20"
        cy="20"
        r="4"
        fill="white"
      />

      {/* 外圈白色边框 */}
      <circle
        cx="20"
        cy="20"
        r="8"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
}

// 创建 Leaflet 图标
export function createUserLocationIcon() {
  const iconMarkup = renderToStaticMarkup(<UserLocationSvg />);
  const iconUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;

  return L.icon({
    iconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}
