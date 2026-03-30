## 基础说明
- 基础路径：`/api`
- 鉴权：除 `POST /api/auth/register`、`POST /api/auth/login` 外，以下接口都需要请求头 `Authorization: Bearer <token>`（使用已有 JWT `authMiddleware`）
- 响应约定：成功返回 `200/201`，失败返回 `{ "message": "..." }`

---

## 认证接口（已有）

### 1. 注册
- `POST /api/auth/register`
- body：
```json
{ "username": "string", "password": "string" }
```
- 成功（201）：
```json
{ "message": "注册成功", "userId": 1 }
```

### 2. 登录
- `POST /api/auth/login`
- body：
```json
{ "username": "string", "password": "string" }
```
- 成功（200）：
```json
{
  "message": "登录成功",
  "token": "jwt...",
  "user": { "id": 1, "username": "..." }
}
```

---

## 用户：绑定车牌号
文件：`src/routes/userVehiclePlate.js`

### 1) 绑定车牌号
- `POST /api/users/vehicle-plate/bind`
- 需要鉴权
- body：
```json
{ "vehicle_plate": "沪A12345" }
```
- 成功（201）：
```json
{
  "message": "绑定成功",
  "data": { "id": 1, "username": "xxx", "bound_vehicle_plate": "沪A12345" }
}
```
- 校验：
  - `vehicle_plate` 必填，且为非空字符串
  - `vehicle_plate` 长度 `<= 20`

### 2) 判断是否绑定
- `GET /api/users/vehicle-plate/status`
- 需要鉴权
- 成功（200）：
```json
{ "bound": true, "vehicle_plate": "沪A12345" }
```

---

## 停车场（停车场 CRUD）
文件：`src/routes/parkingLots.js`

### 1) 停车场列表
- `GET /api/parking-lots`
- 需要鉴权
- query（可选）：
  - `parking_lot_name`：停车场名称模糊匹配
  - `page`：默认 `1`
  - `pageSize`：默认 `10`
- 成功（200）：
```json
{
  "data": [ { "id": 1, "parking_lot_name": "...", "created_at": "...", "updated_at": "..." } ],
  "pagination": { "total": 20, "page": 1, "pageSize": 10, "totalPages": 2 }
}
```

### 2) 停车场详情
- `GET /api/parking-lots/:id`
- 需要鉴权
- 成功（200）：返回单条停车场记录
- 不存在（404）：`{ "message": "停车场不存在" }`

### 3) 新增停车场
- `POST /api/parking-lots`
- 需要鉴权
- body：
```json
{
  "parking_lot_name": "XX停车场",
  "latitude": 31.2304,
  "longitude": 121.4737
}
```
- 成功（201）：`{ "message": "...", "data": { ... } }`
- 校验：
  - `parking_lot_name` 必填、非空字符串、长度 `<= 100`
  - 同名不允许（唯一键）
  - `latitude` 可选：纬度范围 `-90` 到 `90`
  - `longitude` 可选：经度范围 `-180` 到 `180`

### 4) 修改停车场
- `PUT /api/parking-lots/:id`
- 需要鉴权
- body：
```json
{
  "parking_lot_name": "XX停车场(新名)",
  "latitude": 31.2304,
  "longitude": 121.4737
}
```
- 成功（200）：`{ "message": "...", "data": { ... } }`
- 不存在（404）
- 同名冲突（400）：`{ "message": "该停车场名称已存在" }`
  - `latitude`、`longitude` 为可选；如果不传则不更新

### 5) 删除停车场
- `DELETE /api/parking-lots/:id`
- 需要鉴权
- 行为：如果该停车场下存在 `parking_records`，会返回 400 并禁止删除
- 成功（200）：`{ "message": "停车场删除成功" }`

---

## 停车记录（获取/新增/修改/删除）
文件：`src/routes/parkingRecords.js`

重要规则：
- 所有停车记录接口都会读取当前登录用户 `users.bound_vehicle_plate`
- 因此 `GET/PUT/DELETE` 都只会作用于“当前用户绑定车牌号”的记录
- `vehicle_plate` 不从请求体传入：新增/修改始终以用户绑定的车牌号为准
- `owner_phone` 由请求体提供

### 1) 获取停车记录列表
- `GET /api/parking-records`
- 需要鉴权
- query（可选）：
  - `parking_lot_id`
  - `owner_phone`：模糊匹配
  - `start_date`：到达日期范围起（比较 `DATE(arrival_time) >= start_date`）
  - `end_date`：到达日期范围止（比较 `DATE(arrival_time) <= end_date`）
  - `page`：默认 `1`
  - `pageSize`：默认 `10`
- 未绑定车牌号（400）：`{ "message": "未绑定车牌号" }`
- 成功（200）：返回列表与分页信息

### 2) 新增停车记录
- `POST /api/parking-records`
- 需要鉴权
- body：
```json
{
  "parking_lot_id": 1,
  "arrival_time": "2026-03-30 10:30:00",
  "leave_date": "2026-03-30",
  "owner_phone": "13800138000"
}
```
- 校验：
  - `parking_lot_id` 必填
  - `arrival_time` 必填
  - `owner_phone` 必填、非空字符串、长度 `<= 20`
- 不存在停车场（404）：`{ "message": "停车场不存在" }`
- 未绑定车牌号（400）：`{ "message": "未绑定车牌号" }`

### 3) 修改停车记录
- `PUT /api/parking-records/:id`
- 需要鉴权
- body（字段可选，但至少传一个）：
```json
{
  "parking_lot_id": 2,
  "arrival_time": "2026-03-30 11:00:00",
  "leave_date": "2026-03-31",
  "owner_phone": "13800138000"
}
```
- 行为：
  - 只允许修改当前用户绑定车牌号对应的记录
  - 若更新 `parking_lot_id`，会同步写入 `parking_lot_name` 快照
- 成功（200）：`{ "message": "停车记录更新成功", "data": { ... } }`

### 4) 删除停车记录
- `DELETE /api/parking-records/:id`
- 需要鉴权
- 成功（200）：`{ "message": "停车记录删除成功" }`
- 若记录不存在或不属于当前用户（404）：`{ "message": "停车记录不存在或无权限" }`

