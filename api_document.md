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
- 不需要鉴权
- query（可选）：
  - `parking_lot_name`：停车场名称模糊匹配
  - `page`：默认 `1`
  - `pageSize`：默认 `10`
- 成功（200）：
```json
{
  "data": [
    {
      "id": 1,
      "parking_lot_name": "XX停车场",
      "address": "北京市朝阳区XX路100号",
      "pname": "XX停车场",
      "cityname": "北京",
      "adname": "朝阳区",
      "km": 5.5,
      "latitude": 39.9042,
      "longitude": 116.4074,
      "created_at": "2026-04-02T10:00:00",
      "updated_at": "2026-04-02T10:00:00"
    }
  ],
  "pagination": { "total": 20, "page": 1, "pageSize": 10, "totalPages": 2 }
}
```
- 说明：返回字段不包含 `route`（路线数据量大，单独接口获取）

### 2) 停车场详情
- `GET /api/parking-lots/:id`
- 不需要鉴权
- 成功（200）：
```json
{
  "id": 1,
  "parking_lot_name": "XX停车场",
  "address": "北京市朝阳区XX路100号",
  "pname": "XX停车场",
  "cityname": "北京",
  "adname": "朝阳区",
  "km": 5.5,
  "latitude": 39.9042,
  "longitude": 116.4074,
  "created_at": "2026-04-02T10:00:00",
  "updated_at": "2026-04-02T10:00:00"
}
```
- 不存在（404）：`{ "message": "停车场不存在" }`
- 说明：返回字段不包含 `route`（路线数据量大，单独接口获取）

### 3) 获取停车场路线
- `GET /api/parking-lots/:id/route`
- 不需要鉴权
- 成功（200）：
```json
{
  "id": 1,
  "parking_lot_name": "XX停车场",
  "route": [
    { "lat": 39.9, "lng": 116.4 },
    { "lat": 39.91, "lng": 116.41 }
  ]
}
```
- 不存在（404）：`{ "message": "停车场不存在" }`
- 说明：专用接口返回路线数据，`route` 字段为 JSON 格式

### 4) 新增停车场
- `POST /api/parking-lots`
- 需要鉴权
- body：
```json
{
  "parking_lot_name": "XX停车场",
  "address": "北京市朝阳区XX路100号",
  "pname": "XX停车场",
  "cityname": "北京",
  "adname": "朝阳区",
  "route": [{ "lat": 39.9, "lng": 116.4 }],
  "km": 5.5,
  "latitude": 31.2304,
  "longitude": 121.4737
}
```
- 成功（201）：`{ "message": "...", "data": { ... } }`
- 校验：
  - `parking_lot_name` 必填、非空字符串、长度 `<= 100`
  - 同名不允许（唯一键）
  - `address` 可选：地址，最大长度 255
  - `pname` 可选：停车场简称，最大长度 100
  - `cityname` 可选：城市名称，最大长度 50
  - `adname` 可选：区域名称，最大长度 50
  - `route` 可选：路线 JSON（数组格式）
  - `km` 可选：距离，非负数
  - `latitude` 可选：纬度范围 `-90` 到 `90`
  - `longitude` 可选：经度范围 `-180` 到 `180`

### 5) 修改停车场
- `PUT /api/parking-lots/:id`
- 需要鉴权
- body（字段可选，但至少传一个）：
```json
{
  "parking_lot_name": "XX停车场(新名)",
  "address": "新地址",
  "pname": "新简称",
  "cityname": "新城市",
  "adname": "新区域",
  "route": [{ "lat": 39.9, "lng": 116.4 }],
  "km": 10.5,
  "latitude": 31.2304,
  "longitude": 121.4737
}
```
- 成功（200）：`{ "message": "...", "data": { ... } }`
- 不存在（404）
- 同名冲突（400）：`{ "message": "该停车场名称已存在" }`
- 校验：
  - `parking_lot_name` 非空字符串、长度 `<= 100`
  - `route` 必须是有效的 JSON 或 JSON 数组
  - `km` 必须是有效数字
  - `latitude` 范围 `-90` 到 `90`
  - `longitude` 范围 `-180` 到 `180`

### 6) 删除停车场
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

### 5) 获取未完成的预约记录
- `GET /api/parking-records/unfinished`
- 需要鉴权
- 说明：获取当前用户未完成的预约记录，状态根据当前时间与预约离开时间动态判断
- query（可选）：
  - `parking_lot_id`：按停车场ID筛选
  - `page`：默认 `1`
  - `pageSize`：默认 `10`
- 未绑定车牌号（400）：`{ "message": "未绑定车牌号" }`
- 成功（200）：
```json
{
  "data": [
    {
      "id": 1,
      "parking_lot_id": 1,
      "parking_lot_name": "XX停车场",
      "arrival_time": "2026-04-02T10:00:00",
      "leave_date": "2026-04-03",
      "vehicle_plate": "粤B12345",
      "owner_phone": "13800138000",
      "status": "未完成",
      "created_at": "2026-04-02T10:00:00",
      "updated_at": "2026-04-02T10:00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```
- 状态说明：
  - `status` 字段根据当前时间与 `leave_date` 动态判断
  - 若当前时间 > `leave_date`，则状态为 `'已完成'`
  - 否则状态为 `'未完成'`
  - `leave_date` 为 `NULL` 时，状态始终为 `'未完成'`

