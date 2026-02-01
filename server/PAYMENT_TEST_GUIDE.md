# 支付链路测试指南

本指南介绍如何在不真实付费的情况下验证整个支付链路，包括订单创建、支付回调、状态更新和查询执行。

## 目录

1. [支付宝沙箱环境测试（推荐）](#方法一支付宝沙箱环境测试推荐)
2. [模拟支付回调测试](#方法二模拟支付回调测试)
3. [手动触发支付回调](#方法三手动触发支付回调)
4. [测试检查清单](#测试检查清单)

---

## 方法一：支付宝沙箱环境测试（推荐）

这是最接近真实环境的测试方式，使用支付宝官方提供的沙箱环境。

### 1. 配置沙箱环境

#### 1.1 获取沙箱应用信息

1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入 **开发助手** > **沙箱环境**
3. 在 **沙箱应用** 中找到你的应用，或创建一个新的沙箱应用
4. 记录以下信息：
   - **沙箱 APPID**
   - **应用私钥**（需要生成）
   - **支付宝公钥**（上传应用公钥后获取）

#### 1.2 生成沙箱密钥

1. 下载 [支付宝密钥生成工具](https://opendocs.alipay.com/common/02kkv7)
2. 生成 RSA2 密钥对（2048位）
3. 保存私钥（用于 `ALIPAY_APP_PRIVATE_KEY`）
4. 复制应用公钥，上传到支付宝沙箱应用
5. 获取支付宝公钥（用于 `ALIPAY_PUBLIC_KEY`）

#### 1.3 配置环境变量

在 `server/.env` 文件中配置：

```bash
# 使用沙箱环境的 APPID
ALIPAY_APP_ID=你的沙箱APPID

# 沙箱应用的私钥
ALIPAY_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
你的沙箱私钥内容
...
-----END RSA PRIVATE KEY-----"

# 沙箱环境的支付宝公钥
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
沙箱支付宝公钥内容
...
-----END PUBLIC KEY-----"

ALIPAY_SIGN_TYPE=RSA2

# 重要：设置为 True 使用沙箱环境
ALIPAY_DEBUG=True

# 回调地址（开发环境可以使用 HTTP）
ALIPAY_RETURN_URL=http://localhost:3000/vehicle-verify
ALIPAY_NOTIFY_URL=http://localhost:3003/api/vehicle-verify/alipay/notify
```

#### 1.4 获取沙箱测试账号

1. 在支付宝开放平台 **开发助手** > **沙箱环境** 页面
2. 找到 **沙箱账号** 部分
3. 使用提供的 **买家账号** 进行测试支付
4. 密码在页面上显示

### 2. 执行测试流程

#### 2.1 启动服务器

```bash
cd server
python app.py
```

#### 2.2 创建测试订单

1. 打开前端页面（如 `http://localhost:3000`）
2. 进入 **车辆核验** 或 **手机号查验** 页面
3. 填写测试数据
4. 点击 **核验** 按钮
5. 系统会创建订单并跳转到支付宝沙箱支付页面

#### 2.3 使用沙箱账号支付

1. 在支付宝沙箱支付页面，使用沙箱买家账号登录
2. 密码在支付宝开放平台沙箱环境页面显示
3. 完成支付（不会真实扣款）

#### 2.4 验证支付结果

支付完成后，系统会：
1. 接收支付宝异步回调（`/api/vehicle-verify/alipay/notify`）
2. 更新订单状态为 `paid`
3. 自动执行查询并保存结果
4. 跳转回前端页面显示结果

### 3. 验证要点

- ✅ 订单是否成功创建（检查数据库 `orders` 表）
- ✅ 支付回调是否正常接收（查看服务器日志）
- ✅ 订单状态是否更新为 `paid`
- ✅ 查询是否自动执行（检查 `result_data` 字段）
- ✅ 前端是否能正确显示结果

---

## 方法二：模拟支付回调测试（最简单）

系统已经内置了测试接口 `/api/test/simulate-payment`，可以直接使用。

### 1. 使用测试脚本（推荐）

使用提供的测试脚本可以一键完成整个测试流程：

```bash
cd server
./test_payment_flow.sh
```

脚本会：
1. 交互式选择核验类型
2. 自动创建测试订单
3. 模拟支付回调
4. 检查订单状态和查询结果

**指定参数运行**：

```bash
# 测试指定订单
./test_payment_flow.sh -o VH2024120112000012345678

# 测试特定类型
./test_payment_flow.sh -t mobile2Meta

# 指定API地址
./test_payment_flow.sh -u http://localhost:3003 -t mobile3Meta
```

### 2. 手动调用测试接口

#### 2.1 创建订单

首先通过前端或API创建订单，记录返回的 `orderId`。

#### 2.2 调用模拟接口

使用 curl 或 Postman 调用测试接口：

```python
# 测试接口：模拟支付回调
@app.route('/api/test/simulate-payment', methods=['POST'])
def simulate_payment():
    """模拟支付回调（仅用于测试）"""
    try:
        data = request.json
        order_id = data.get('order_id')
        trade_no = data.get('trade_no', f'TEST{datetime.now().strftime("%Y%m%d%H%M%S")}')
        trade_status = data.get('trade_status', 'TRADE_SUCCESS')
        
        if not order_id:
            return jsonify({'error': '缺少订单号'}), 400
        
        # 模拟支付宝回调数据
        mock_data = {
            'out_trade_no': order_id,
            'trade_no': trade_no,
            'trade_status': trade_status,
            'total_amount': data.get('total_amount', '9.90'),
            'subject': data.get('subject', '信息核验'),
            'sign': 'mock_sign_for_test',
            'sign_type': 'RSA2'
        }
        
        # 直接调用回调处理逻辑
        db = get_db()
        try:
            order = db.query(Order).filter(Order.order_id == order_id).first()
            
            if not order:
                return jsonify({'error': '订单不存在'}), 404
            
            # 更新订单状态
            order.trade_status = trade_status
            order.trade_no = trade_no
            
            if trade_status == 'TRADE_SUCCESS' or trade_status == 'TRADE_FINISHED':
                order.status = 'paid'
                order.paid_at = datetime.now()
                app.logger.info(f'[测试] 订单 {order_id} 支付成功，交易号: {trade_no}')
                
                # 执行查询
                if order.form_data and order.form_data != {}:
                    execute_vehicle_verify_and_save(order, db)
                    db.refresh(order)
            
            db.commit()
            
            return jsonify({
                'success': True,
                'message': '支付回调模拟成功',
                'order_id': order_id,
                'status': order.status,
                'has_result': order.result_data is not None
            })
        except Exception as e:
            db.rollback()
            app.logger.error(f'模拟支付回调失败: {str(e)}', exc_info=True)
            return jsonify({'error': str(e)}), 500
        finally:
            db.close()
            
    except Exception as e:
        app.logger.error(f'模拟支付回调错误: {str(e)}', exc_info=True)
        return jsonify({'error': str(e)}), 500
```

### 2. 使用测试接口

#### 2.1 创建订单

1. 在前端创建订单（不进行真实支付）
2. 记录返回的 `orderId`

#### 2.2 调用模拟接口

使用 curl 或 Postman 调用测试接口：

```bash
curl -X POST http://localhost:3003/api/test/simulate-payment \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "VH2024120112000012345678",
    "trade_no": "TEST202412011200001234",
    "trade_status": "TRADE_SUCCESS",
    "total_amount": "9.90",
    "subject": "手机号二要素核验"
  }'
```

**响应示例**：

```json
{
  "success": true,
  "message": "支付回调模拟成功",
  "order_id": "VH2024120112000012345678",
  "trade_no": "TEST202412011200001234",
  "status": "paid",
  "trade_status": "TRADE_SUCCESS",
  "has_result": true,
  "result_data": {
    "code": "200",
    "message": "成功",
    ...
  }
}
```

#### 2.3 验证结果

检查返回的 `status` 是否为 `paid`，`has_result` 是否为 `true`。

也可以调用订单详情接口验证：

```bash
curl http://localhost:3003/api/vehicle-verify/order/VH2024120112000012345678
```

---

## 方法三：手动触发支付回调

如果已经有订单记录，可以直接调用支付回调接口来测试。

### 1. 准备测试数据

首先需要创建一个订单（通过前端或直接插入数据库）。

### 2. 构造回调数据

支付宝回调的数据格式如下：

```
out_trade_no=订单号
trade_no=支付宝交易号
trade_status=TRADE_SUCCESS
total_amount=9.90
subject=订单标题
sign=签名（测试时可以跳过验证）
sign_type=RSA2
```

### 3. 调用回调接口

**注意**：由于回调接口有签名验证，直接调用可能会失败。建议：

1. **临时禁用签名验证**（仅用于测试）：
   - 在 `alipay_notify` 函数中，临时注释掉签名验证部分
   - 测试完成后恢复

2. **或使用测试接口**（方法二）：
   - 使用上面创建的 `/api/test/simulate-payment` 接口

---

## 测试检查清单

### 订单创建阶段

- [ ] 订单是否成功创建到数据库
- [ ] 订单状态是否为 `pending`
- [ ] 订单信息（金额、类型、表单数据）是否正确
- [ ] 是否返回了支付URL

### 支付回调阶段

- [ ] 支付回调是否正常接收（查看服务器日志）
- [ ] 订单状态是否更新为 `paid`
- [ ] `trade_no` 和 `trade_status` 是否正确保存
- [ ] `paid_at` 时间是否正确记录

### 查询执行阶段

- [ ] 查询是否自动执行（检查日志）
- [ ] 查询结果是否保存到 `result_data`
- [ ] `verified_at` 时间是否正确记录
- [ ] 如果查询失败，错误是否被正确记录

### 前端显示阶段

- [ ] 前端是否能正确获取订单信息
- [ ] 查询结果是否正确显示
- [ ] 订单列表是否包含该订单
- [ ] 订单详情页面是否正常显示

### 异常情况测试

- [ ] 订单创建失败时，支付回调是否能恢复订单
- [ ] 支付回调时订单不存在，是否能创建订单记录
- [ ] 查询执行失败时，订单状态是否正确
- [ ] 网络异常时，系统是否能正确处理

---

## 常见问题

### 1. 沙箱环境支付失败

**问题**：在沙箱环境支付时提示错误

**解决方案**：
- 检查是否设置了 `ALIPAY_DEBUG=True`
- 确认使用的是沙箱 APPID 和沙箱密钥
- 确认使用的是沙箱买家账号
- 检查回调地址是否正确配置

### 2. 支付回调未收到

**问题**：支付完成后，服务器没有收到回调

**解决方案**：
- 检查 `ALIPAY_NOTIFY_URL` 是否正确配置
- 确认回调地址是公网可访问的（沙箱环境可以使用内网穿透工具，如 ngrok）
- 查看服务器日志，确认是否有回调请求
- 检查防火墙设置

### 3. 订单状态未更新

**问题**：支付完成后，订单状态仍然是 `pending`

**解决方案**：
- 检查支付回调是否正常接收（查看日志）
- 确认回调中的 `trade_status` 是否为 `TRADE_SUCCESS` 或 `TRADE_FINISHED`
- 检查数据库事务是否正常提交
- 查看是否有异常错误日志

### 4. 查询未自动执行

**问题**：订单已支付，但查询结果为空

**解决方案**：
- 检查订单的 `form_data` 是否为空
- 查看服务器日志，确认查询是否执行
- 检查阿里云API配置是否正确
- 确认查询API调用是否成功

---

## 调试技巧

### 1. 查看服务器日志

```bash
# 查看实时日志
tail -f server/logs/app.log

# 或如果使用 systemd
journalctl -u your-service-name -f
```

### 2. 检查数据库

```sql
-- 查看订单列表
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- 查看特定订单
SELECT * FROM orders WHERE order_id = 'VH2024120112000012345678';

-- 查看支付成功的订单
SELECT order_id, status, trade_status, paid_at, verified_at 
FROM orders 
WHERE status = 'paid' 
ORDER BY paid_at DESC;
```

### 3. 使用测试工具

- **Postman**：用于测试API接口
- **ngrok**：用于内网穿透，测试回调（`ngrok http 3003`）
- **curl**：用于命令行测试

---

## 注意事项

1. **测试环境隔离**：确保测试数据不会影响生产环境
2. **密钥安全**：不要将真实环境的密钥用于测试
3. **日志记录**：测试时保留详细日志，便于问题排查
4. **数据清理**：测试完成后，清理测试数据
5. **签名验证**：生产环境必须启用签名验证，测试时可以临时禁用

---

## 相关文档

- [支付宝配置指南](./ALIPAY_CONFIG_GUIDE.md)
- [测试指南](./TEST_GUIDE.md)
- [支付宝开放平台文档](https://opendocs.alipay.com/)

