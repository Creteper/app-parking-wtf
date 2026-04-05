import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from "axios";
import { BACKEND_BASE_URL } from "./env";

const API_PREFIX = "/api";
const TOKEN_STORAGE_KEY = "parkingwtf_jwt";

let memoryToken: string | null = null;

function safeReadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore storage failures (e.g. privacy mode)
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  const stored = safeReadTokenFromStorage();
  memoryToken = stored;
  return stored;
}

export function clearToken() {
  setToken(null);
}

export type ApiErrorResponse = {
  message: string;
};

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    const authValue = `Bearer ${token}`;
    const headers: any = config.headers ?? {};

    // axios v1 headers 可能是 AxiosHeaders 实例（带 set/get），也可能是普通对象
    if (typeof headers.set === "function") {
      headers.set("Authorization", authValue);
      config.headers = headers;
    } else {
      config.headers = {
        ...headers,
        Authorization: authValue,
      } as any;
    }
  }
  return config;
});

/* ----------------------------- Auth ----------------------------- */
export type AuthRegisterBody = {
  username: string;
  password: string;
};

export type AuthLoginBody = {
  username: string;
  password: string;
};

export type AuthRegisterResponse = {
  message: string;
  userId: number;
};

export type AuthLoginResponse = {
  message: string;
  token?: string;
  user?: {
    id: number;
    username: string;
  };
};

export const auth = {
  register(body: AuthRegisterBody): Promise<AxiosResponse<AuthRegisterResponse>> {
    return axiosInstance.post<AuthRegisterResponse>(
      `${API_PREFIX}/auth/register`,
      body,
    );
  },

  async login(body: AuthLoginBody): Promise<AxiosResponse<AuthLoginResponse>> {
    const res = await axiosInstance.post<AuthLoginResponse>(
      `${API_PREFIX}/auth/login`,
      body,
    );
    if (typeof res.data?.token === "string" && res.data.token.length > 0) {
      setToken(res.data.token);
    }
    return res;
  },
};

/* ---------------------- User: Vehicle Plate ---------------------- */
export type BindVehiclePlateBody = {
  vehicle_plate: string;
};

export type VehiclePlateStatusResponse = {
  bound: boolean;
  vehicle_plate: string;
};

export const usersVehiclePlate = {
  bind(
    body: BindVehiclePlateBody,
  ): Promise<AxiosResponse<unknown>> {
    return axiosInstance.post(`${API_PREFIX}/users/vehicle-plate/bind`, body);
  },

  status(): Promise<AxiosResponse<VehiclePlateStatusResponse>> {
    return axiosInstance.get(`${API_PREFIX}/users/vehicle-plate/status`);
  },
};

/* -------------------------- Parking Lots ------------------------- */
export type RoutePoint = {
  lat: number;
  lng: number;
};

export type ParkingLot = {
  id: number;
  parking_lot_name: string;
  address: string;
  pname: string;
  cityname: string;
  adname: string;
  km: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  // 其他字段由后端决定
  [key: string]: unknown;
};

export type ParkingLotRouteResponse = {
  id: number;
  parking_lot_name: string;
  route: RoutePoint[];
};

/* -------------------------- Navigation Route ------------------------- */
// 步骤中的 TMC 交通信息
export type TmcInfo = {
  lcode: unknown[];
  status: string;
  distance: string;
  polyline: string; // "lng,lat;lng,lat;..."
};

// 导航步骤
export type NavigationStep = {
  tmcs: TmcInfo[];
  tolls: string;
  action: string;
  cities: {
    name: string;
    adcode: string;
    citycode: string;
    districts: { name: string; adcode: string }[];
  }[];
  distance: string;
  duration: string;
  polyline: string;
  road?: string;
  instruction: string;
  orientation: string;
  toll_road: unknown[];
  assistant_action: unknown[];
};

// 路径
export type NavigationPath = {
  steps: NavigationStep[];
};

// 路线数据 - 可能是简单格式或复杂格式
export type RouteData =
  | RoutePoint[]                    // 简单格式: [{lat, lng}, ...]
  | { paths: NavigationPath[] };    // 复杂格式: { paths: [...] }

// 导航路线响应
export type NavigationRouteResponse = {
  id: number;
  parking_lot_name: string;
  info?: string;
  count?: string;
  route: RouteData | { route: RouteData }; // 处理嵌套的 route
};

export type ParkingLotsListQuery = {
  parking_lot_name?: string;
  page?: number;
  pageSize?: number;
};

export type Pagination = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ParkingLotsListResponse = {
  data: ParkingLot[];
  pagination: Pagination;
};


export type CreateParkingLotBody = {
  parking_lot_name: string;
  address?: string;
  pname?: string;
  cityname?: string;
  adname?: string;
  route?: RoutePoint[];
  km?: number;
  latitude?: number;
  longitude?: number;
};

export type UpdateParkingLotBody = {
  parking_lot_name?: string;
  address?: string;
  pname?: string;
  cityname?: string;
  adname?: string;
  route?: RoutePoint[];
  km?: number;
  latitude?: number;
  longitude?: number;
};

export type ParkingLotMessageResponse<T = unknown> = {
  message: string;
  data?: T;
};

export const parkingLots = {
  list(
    params?: ParkingLotsListQuery,
  ): Promise<AxiosResponse<ParkingLotsListResponse>> {
    return axiosInstance.get<ParkingLotsListResponse>(
      `${API_PREFIX}/parking-lots`,
      { params },
    );
  },

  get(id: number): Promise<AxiosResponse<ParkingLot>> {
    return axiosInstance.get<ParkingLot>(
      `${API_PREFIX}/parking-lots/${id}`,
    );
  },

  create(
    body: CreateParkingLotBody,
  ): Promise<AxiosResponse<ParkingLotMessageResponse<ParkingLot>>> {
    return axiosInstance.post<ParkingLotMessageResponse<ParkingLot>>(
      `${API_PREFIX}/parking-lots`,
      body,
    );
  },

  update(
    id: number,
    body: UpdateParkingLotBody,
  ): Promise<AxiosResponse<ParkingLotMessageResponse<ParkingLot>>> {
    return axiosInstance.put<ParkingLotMessageResponse<ParkingLot>>(
      `${API_PREFIX}/parking-lots/${id}`,
      body,
    );
  },

  remove(id: number): Promise<AxiosResponse<ParkingLotMessageResponse>> {
    return axiosInstance.delete<ParkingLotMessageResponse>(
      `${API_PREFIX}/parking-lots/${id}`,
    );
  },

  getRoute(id: number): Promise<AxiosResponse<NavigationRouteResponse>> {
    return axiosInstance.get<NavigationRouteResponse>(
      `${API_PREFIX}/parking-lots/${id}/route`,
    );
  },
};

/* ----------------------- Parking Records ------------------------ */
export type ParkingRecord = {
  id: number;
  parking_lot_id?: number;
  parking_lot_name?: string;
  arrival_time?: string;
  leave_date?: string;
  owner_phone?: string;
  vehicle_plate?: string;
  status?: "已完成" | "未完成";
  created_at?: string;
  updated_at?: string;
  // 其他字段由后端决定
  [key: string]: unknown;
};

export type UnfinishedParkingRecord = {
  id: number;
  parking_lot_id: number;
  parking_lot_name: string;
  arrival_time: string;
  leave_date: string;
  vehicle_plate: string;
  owner_phone: string;
  status: "已完成" | "未完成";
  created_at: string;
  updated_at: string;
};

export type UnfinishedParkingRecordsQuery = {
  parking_lot_id?: number;
  page?: number;
  pageSize?: number;
};

export type UnfinishedParkingRecordsResponse = {
  data: UnfinishedParkingRecord[];
  pagination: Pagination;
};

export type ParkingRecordsListQuery = {
  parking_lot_id?: number;
  owner_phone?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  pageSize?: number;
};

export type ParkingRecordsListResponse = {
  data: ParkingRecord[];
  pagination?: Pagination;
};

export type CreateParkingRecordBody = {
  parking_lot_id: number;
  arrival_time: string;
  leave_date: string;
  owner_phone: string;
};

export type UpdateParkingRecordBody = {
  parking_lot_id?: number;
  arrival_time?: string;
  leave_date?: string;
  owner_phone?: string;
};

export const parkingRecords = {
  list(
    params?: ParkingRecordsListQuery,
  ): Promise<AxiosResponse<ParkingRecordsListResponse>> {
    return axiosInstance.get<ParkingRecordsListResponse>(
      `${API_PREFIX}/parking-records`,
      { params },
    );
  },

  create(
    body: CreateParkingRecordBody,
  ): Promise<AxiosResponse<ParkingLotMessageResponse<ParkingRecord>>> {
    return axiosInstance.post<ParkingLotMessageResponse<ParkingRecord>>(
      `${API_PREFIX}/parking-records`,
      body,
    );
  },

  update(
    id: number,
    body: UpdateParkingRecordBody,
  ): Promise<AxiosResponse<ParkingLotMessageResponse<ParkingRecord>>> {
    return axiosInstance.put<ParkingLotMessageResponse<ParkingRecord>>(
      `${API_PREFIX}/parking-records/${id}`,
      body,
    );
  },

  remove(id: number): Promise<AxiosResponse<ParkingLotMessageResponse>> {
    return axiosInstance.delete<ParkingLotMessageResponse>(
      `${API_PREFIX}/parking-records/${id}`,
    );
  },

  unfinished(
    params?: UnfinishedParkingRecordsQuery,
  ): Promise<AxiosResponse<UnfinishedParkingRecordsResponse>> {
    return axiosInstance.get<UnfinishedParkingRecordsResponse>(
      `${API_PREFIX}/parking-records/unfinished`,
      { params },
    );
  },
};

/* ---------------------- Optional default export ---------------------- */
export const api = {
  auth,
  usersVehiclePlate,
  parkingLots,
  parkingRecords,
};

export type { AxiosError };

