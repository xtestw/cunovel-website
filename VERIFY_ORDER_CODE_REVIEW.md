# 核检订单流程 - 代码逻辑审查

## 结论概览

- **整体逻辑正确**：创建订单 → 支付 → 回调/轮询更新状态 → 支付成功后执行核验 → 结果页展示，流程闭环完整。
- **已修复 3 处问题**：（1）`check_payment_status` 在本地无订单但支付宝已支付时补建订单，避免结果页 404；（2）`POST /verify` 使用订单中的 `form_data` 执行核验，避免客户端篡改查询内容；（3）补建订单失败时返回 500 而非 `paid`，避免前端跳转结果页 404。
- **可选优化 2 点**：核验执行的并发控制、核验失败后的重试策略，可按需要再做。
- **健壮性加固（第 4 轮）**：创建订单时校验 `form_data` 为 dict；核验执行与 POST /verify 中校验 `order.form_data` 为 dict，避免非对象数据导致核验报错。

---

## 1. 已修复问题

### 1.1 支付状态查询返回“已支付”但本地无订单导致结果页 404

**现象**：创建订单时若写库失败（例如 DB 异常后 rollback），接口仍会返回 `paymentUrl`。用户完成支付后，若先轮询到“已支付”（`check_payment_status` 查支付宝得到 `TRADE_SUCCESS`），而本地库中还没有该订单（notify 未到或也失败），接口会返回 `status: 'paid'`，前端跳转到 `/verify-result?orderId=xxx`。此时 `GET /api/vehicle-verify/order/<order_id>` 会 404，用户看到“订单不存在”。

**原因**：`check_payment_status` 在 `order is None` 且支付宝返回已支付时，只根据支付宝结果返回了 `paid`，没有在本地创建订单记录。

**修复**：在 `server/app.py` 的 `check_payment_status` 中，当 `order is None` 且 `trade_status in ('TRADE_SUCCESS', 'TRADE_FINISHED')` 时，在本地补建一条最小订单（与 `alipay_notify` 的恢复逻辑一致）：`order_id`、`status='paid'`、`trade_no`、`trade_status`、`paid_at`、`form_data={}`、`verify_type='unknown'`、`subject='信息核验'` 等。这样结果页 `GET order/<id>` 能拿到订单，展示“已支付但无核验结果”（因无 `form_data` 无法补跑核验）。

### 1.2 POST /verify 使用请求体 form_data 导致可篡改查询内容

**现象**：`POST /api/vehicle-verify/verify` 使用请求体中的 `data`（form_data）调用阿里云核验接口，仅校验了 `order.verify_type == verify_type`，未校验或使用订单中保存的 `form_data`。理论上可对已支付订单传入不同的手机号/银行卡等，用该订单“额度”查询他人信息并写回该订单。

**修复**：在 `vehicle_verify()` 中改为使用 `order.form_data` 调用 `call_aliyun_*`，并增加“订单缺少表单数据”时返回 400。核验结果与支付时提交的内容一致，且无法被请求体篡改。

### 1.3 补建订单失败时仍返回 paid 导致结果页 404

**现象**：在 `check_payment_status` 中，当本地无订单、支付宝已支付时尝试补建订单；若补建失败（如 DB 异常），`order` 仍为 `None`，但代码仍按 `trade_status` 返回 `status: 'paid'`。前端据此跳转结果页，`GET order/<id>` 返回 404。

**修复**：补建订单的 `except` 中，在 `order = None` 之后直接 `return jsonify({...}), 500`，不再落入下方“返回状态”逻辑。前端收到非 2xx 会抛错并继续轮询或显示超时，不会误跳结果页。

---

## 2. 逻辑正确性说明

- **创建订单**：生成 `order_id`、落库 `form_data`/`verify_type`/`amount` 等，返回支付 URL，逻辑正确。
- **支付宝 notify**：验签 → 更新/补建订单 → 已支付且存在 `form_data` 时调用 `execute_vehicle_verify_and_save`，逻辑正确。
- **核验执行**：`execute_vehicle_verify_and_save` 内先判断 `result_data` 已有则直接返回，再判断 `status == 'paid'` 和 `form_data` 非空，然后按 `verify_type` 调对应阿里云接口并写回 `result_data`，逻辑正确。
- **结果页**：用 `orderId` 拉取订单详情；已支付且无 `resultData` 时轮询同一接口，而该接口在“已支付且无结果”时会触发一次核验，逻辑正确。
- **权限**：未登录只能访问 `user_id is None` 的订单，与“仅凭订单号查看结果”的使用方式一致。

---

## 3. 可选优化（非错误）

### 3.1 核验执行的并发与重复调用

**现象**：`execute_vehicle_verify_and_save` 可能被多处触发：  
`alipay_notify`、`check_payment_status` 查支付宝得到已支付时、`get_order_detail` 发现已支付但无结果时。若多路几乎同时执行，在第一个请求尚未写入 `result_data` 前，多个请求都可能通过“无 result_data”的检查，导致对同一订单多次调用阿里云核验接口。

**影响**：多扣费、可能触发限流；结果以最后一次写入为准，一般不会出现“结果错乱”。

**可选方案**：对“执行核验”加锁（例如按 `order_id` 的 DB 行锁 `SELECT ... FOR UPDATE` 或 Redis 分布式锁），保证同一订单同一时刻只执行一次核验。

### 3.0 健壮性加固（已做）

- **form_data 类型校验**：`create_vehicle_verify_order` 要求请求体 `form_data` 为 dict，否则 400；`execute_vehicle_verify_and_save` 与 `vehicle_verify()` 中要求 `order.form_data` 为 dict 且非空，否则视为“缺少表单数据”并跳过/返回 400，避免历史异常数据或错误请求导致核验接口 AttributeError。

### 3.2 核验失败后的状态与重试

**现象**：核验接口抛异常时，仅打日志，不修改订单状态；订单仍为 `paid` 且无 `result_data`。之后每次 `get_order_detail` 都会再次尝试执行核验，相当于“无限重试”。

**影响**：对临时故障（网络、限流等）有自愈能力；对永久失败（如参数错误、业务拒绝）会一直重试。

**可选方案**：增加“核验失败”状态或重试次数上限，超过后不再自动执行核验，仅支持人工/客服处理。

---

## 4. 小结

- 核检订单的主流程和状态流转是正确、闭环的。
- 已修复：（1）支付状态为已支付但本地无订单导致结果页 404；（2）POST /verify 使用请求体 form_data 导致可篡改查询内容；（3）补建订单失败时仍返回 paid 导致结果页 404。
- 其余为可选的健壮性与成本优化，可按业务需求再迭代。
