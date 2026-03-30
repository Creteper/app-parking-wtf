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
export type ParkingLot = {
  id: number;
  parking_lot_name: string;
  created_at: string;
  updated_at: string;
  // 其他字段由后端决定
  [key: string]: unknown;
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

export type ParkingLotsGetResponse = {
  // 文档说明为“单条停车场记录”，字段由后端决定
  [key: string]: unknown;
};

export type CreateParkingLotBody = {
  parking_lot_name: string;
  latitude?: number;
  longitude?: number;
};

export type UpdateParkingLotBody = {
  parking_lot_name?: string;
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

  get(id: number): Promise<AxiosResponse<ParkingLotsGetResponse>> {
    return axiosInstance.get<ParkingLotsGetResponse>(
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
};

/* ----------------------- Parking Records ------------------------ */
export type ParkingRecord = {
  id: number;
  parking_lot_id?: number;
  parking_lot_name?: string;
  arrival_time?: string;
  leave_date?: string;
  owner_phone?: string;
  // 其他字段由后端决定
  [key: string]: unknown;
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
};

/* ---------------------- Optional default export ---------------------- */
export const api = {
  auth,
  usersVehiclePlate,
  parkingLots,
  parkingRecords,
};

export type { AxiosError };

