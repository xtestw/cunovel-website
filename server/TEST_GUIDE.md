# 阿里云车辆核验接口测试指南

本文档说明如何测试阿里云车辆核验接口的实现。

## 一、准备工作

### 1. 配置环境变量

确保 `server/.env` 文件中配置了阿里云密钥：

```bash
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_ENDPOINT=cloudauth.aliyuncs.com
```

### 2. 安装依赖

```bash
cd server
pip install -r requirements.txt
```

## 二、测试方法

### 方法一：使用测试脚本（推荐）

#### 1. 直接测试辅助函数

测试 `vehicle_verify_helper.py` 中的函数，不经过 HTTP 接口：

```bash
# 测试所有类型
python3 test_aliyun_verify.py

# 测试特定类型
python3 test_aliyun_verify.py --type consistency
python3 test_aliyun_verify.py --type basicInfo
python3 test_aliyun_verify.py --type insuranceLog

# 测试一致性核验（指定要素数量）
python3 test_aliyun_verify.py --type consistency --element 2  # 二要素
python3 test_aliyun_verify.py --type consistency --element 3  # 三要素

# 只检查配置
python3 test_aliyun_verify.py --type config
```

#### 2. 测试 API 端点

需要先启动服务器：

```bash
# 启动服务器
cd server
python3 app.py

# 在另一个终端运行测试脚本
./test_api_endpoints.sh
```

或者使用 curl 手动测试：

```bash
# 测试一致性核验（二要素）
curl -X POST http://localhost:3003/api/vehicle-verify/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "consistency",
    "data": {
      "name": "张三",
      "idCard": "",
      "plateNumber": "京A12345",
      "vehicleType": "02"
    },
    "orderId": "TEST_ORDER_001"
  }'

# 测试基本信息查询
curl -X POST http://localhost:3003/api/vehicle-verify/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "basicInfo",
    "data": {
      "plateNumber": "京A12345",
      "vehicleType": "02"
    },
    "orderId": "TEST_ORDER_002"
  }'

# 测试投保日志查询
curl -X POST http://localhost:3003/api/vehicle-verify/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "insuranceLog",
    "data": {
      "plateNumber": "京A12345",
      "vehicleType": "02",
      "vin": "LSGBF53M8DS123456"
    },
    "orderId": "TEST_ORDER_003"
  }'
```

### 方法二：使用 Python 交互式测试

```python
from dotenv import load_dotenv
load_dotenv()

from vehicle_verify_helper import call_aliyun_vehicle_verify

# 测试一致性核验（二要素）
result = call_aliyun_vehicle_verify('consistency', {
    'name': '张三',
    'idCard': '',
    'plateNumber': '京A12345',
    'vehicleType': '02'
})
print(result)

# 测试基本信息查询
result = call_aliyun_vehicle_verify('basicInfo', {
    'plateNumber': '京A12345',
    'vehicleType': '02'
})
print(result)

# 测试投保日志查询
result = call_aliyun_vehicle_verify('insuranceLog', {
    'plateNumber': '京A12345',
    'vehicleType': '02',
    'vin': 'LSGBF53M8DS123456'
})
print(result)
```

### 方法三：通过前端界面测试

1. 启动服务器：
   ```bash
   cd server
   python3 app.py
   ```

2. 启动前端（如果使用）：
   ```bash
   cd ..
   npm start
   ```

3. 访问车辆核验页面，填写表单并提交测试

## 三、测试用例

### 1. 一致性核验（二要素）

**输入：**
- 姓名：张三
- 身份证号：（不填）
- 车牌号：京A12345
- 车辆类型：02（普通小客车）

**预期：**
- 调用 `VehicleMetaVerifyV2` API
- `VerifyMetaType` 为 `VEHICLE_2_META`
- 返回核验结果（一致/不一致/查无记录）

### 2. 一致性核验（三要素）

**输入：**
- 姓名：张三
- 身份证号：110101199001011234
- 车牌号：京A12345
- 车辆类型：02

**预期：**
- 调用 `VehicleMetaVerifyV2` API
- `VerifyMetaType` 为 `VEHICLE_3_META`
- 返回核验结果

### 3. 基本信息查询

**输入：**
- 车牌号：京A12345
- 车辆类型：02

**预期：**
- 调用 `VehicleInfoIdentification` API
- 返回车辆基本信息

### 4. 投保日志查询

**输入：**
- 车牌号：京A12345
- 车辆类型：02
- VIN：LSGBF53M8DS123456

**预期：**
- 调用 `VehicleInsuranceDateQuery` API
- 返回车辆投保日志

## 四、常见问题

### 1. 配置错误

**错误信息：** `阿里云配置未设置`

**解决方法：**
- 检查 `.env` 文件是否存在
- 确认 `ALIYUN_ACCESS_KEY_ID` 和 `ALIYUN_ACCESS_KEY_SECRET` 已正确配置

### 2. API 调用失败

**错误信息：** `调用阿里云API失败`

**可能原因：**
- 密钥不正确
- 网络连接问题
- API 参数错误
- 账户余额不足

**解决方法：**
- 检查密钥是否正确
- 检查网络连接
- 查看阿里云控制台的 API 调用日志
- 确认账户有足够余额

### 3. 签名错误

**错误信息：** `SignatureDoesNotMatch`

**解决方法：**
- 检查密钥是否正确
- 确认签名算法实现正确（HMAC-SHA1）
- 检查参数编码是否正确

## 五、调试技巧

### 1. 启用详细日志

在 `vehicle_verify_helper.py` 中添加日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 2. 打印请求参数

在 `_build_params` 方法中添加：

```python
def _build_params(self, action, params):
    # ... 现有代码 ...
    print(f"请求参数: {common_params}")  # 调试用
    return common_params
```

### 3. 打印响应内容

在 API 调用方法中添加：

```python
response = requests.get(url, params=request_params, timeout=30)
print(f"响应状态码: {response.status_code}")
print(f"响应内容: {response.text}")  # 调试用
response.raise_for_status()
```

## 六、测试数据说明

### 车辆类型

- `02`: 普通小客车
- `52`: 新能源小客车

### 车牌号格式

- 标准格式：省份简称 + 字母 + 数字/字母组合
- 示例：`京A12345`、`浙A12U6P`

### VIN 格式

- 17 位字符，包含数字和字母（排除 I、O、Q）
- 示例：`LSGBF53M8DS123456`

## 七、参考文档

- [阿里云车辆要素核验文档](https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vehicle-element-verification-enhanced)
- [阿里云车辆信息识别文档](https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vehicle-information-identification)
- [阿里云车辆投保日志查询文档](https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vehicle-insurance-date-query)

