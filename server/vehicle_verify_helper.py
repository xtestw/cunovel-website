"""
车辆信息核验辅助函数
用于调用阿里云车辆核验API

根据阿里云官方SDK，应该使用：
- API版本：2019-03-07
- Action名称：VehicleMetaVerify（不是VehicleMetaVerifyV2）
- 区域端点：cloudauth.cn-shanghai.aliyuncs.com 或 cloudauth.cn-beijing.aliyuncs.com
"""
import os
import json
import hmac
import hashlib
import base64
import urllib.parse
import uuid
from datetime import datetime
import requests

# 尝试导入官方SDK
try:
    from alibabacloud_cloudauth20190307.client import Client as CloudAuthClient
    from alibabacloud_cloudauth20190307 import models as cloudauth_models
    from alibabacloud_tea_util import models as util_models
    from alibabacloud_credentials.client import Client as CredentialClient
    from alibabacloud_credentials import models as credential_models
    from alibabacloud_tea_openapi import models as open_api_models
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    CloudAuthClient = None

class AliyunVehicleVerify:
    """阿里云车辆核验API客户端"""
    
    def __init__(self, access_key_id, access_key_secret, endpoint='cloudauth.cn-shanghai.aliyuncs.com'):
        """
        初始化阿里云车辆核验API客户端
        
        参数:
            access_key_id: 阿里云AccessKey ID
            access_key_secret: 阿里云AccessKey Secret
            endpoint: API端点，默认为 cloudauth.cn-shanghai.aliyuncs.com
                     建议使用区域端点：cloudauth.cn-shanghai.aliyuncs.com 或 cloudauth.cn-beijing.aliyuncs.com
        """
        self.access_key_id = access_key_id
        self.access_key_secret = access_key_secret
        # 确保端点不包含协议前缀
        self.endpoint = endpoint.replace('https://', '').replace('http://', '').rstrip('/')
        # 根据官方SDK，API版本应该是 2019-03-07
        self.api_version = '2019-03-07'
    
    def _sign_request(self, params, method='GET'):
        """签名请求参数"""
        # 按参数名排序
        sorted_params = sorted(params.items())
        # 构建查询字符串
        query_string = '&'.join([f'{k}={urllib.parse.quote(str(v), safe="")}' for k, v in sorted_params])
        # 构建待签名字符串
        string_to_sign = f'{method}&%2F&{urllib.parse.quote(query_string, safe="")}'
        # 计算签名
        signature = base64.b64encode(
            hmac.new(
                (self.access_key_secret + '&').encode('utf-8'),
                string_to_sign.encode('utf-8'),
                hashlib.sha1
            ).digest()
        ).decode('utf-8')
        return signature
    
    def _build_params(self, action, params):
        """构建请求参数"""
        common_params = {
            'Format': 'JSON',
            'Version': self.api_version,
            'AccessKeyId': self.access_key_id,
            'SignatureMethod': 'HMAC-SHA1',
            'Timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'SignatureVersion': '1.0',
            'SignatureNonce': str(uuid.uuid4()),
            'Action': action
        }
        common_params.update(params)
        # 添加签名（默认使用GET方法）
        signature = self._sign_request(common_params, method='GET')
        common_params['Signature'] = signature
        return common_params
    
    def vehicle_meta_verify_v2(self, param_type, verify_meta_type, user_name, vehicle_num, 
                               identify_num=None, vehicle_type=None):
        """
        车辆要素核验增强版
        param_type: normal 或 md5
        verify_meta_type: VEHICLE_2_META 或 VEHICLE_3_META
        """
        params = {
            'ParamType': param_type,
            'VerifyMetaType': verify_meta_type,
            'UserName': user_name,
            'VehicleNum': vehicle_num
        }
        if identify_num:
            params['IdentifyNum'] = identify_num
        if vehicle_type:
            params['VehicleType'] = vehicle_type
        
        # 根据阿里云官方SDK示例，使用 VehicleMetaVerify（不是VehicleMetaVerifyV2）
        request_params = self._build_params('VehicleMetaVerify', params)
        # 阿里云API需要使用完整的端点URL，包含协议和路径
        url = f'https://{self.endpoint}'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # 获取详细的错误信息
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            # 如果是 InvalidAction.NotFound 错误，提供更详细的提示
            if error_json.get('Code') == 'InvalidAction.NotFound':
                # 获取当前使用的Action名称
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'   建议使用区域端点：cloudauth.cn-shanghai.aliyuncs.com 或 cloudauth.cn-beijing.aliyuncs.com\n'
                    f'4. 是否已在阿里云控制台开通车辆核验服务\n'
                    f'建议：查看阿里云API文档确认正确的Action名称和版本\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def vehicle_info_identification(self, vehicle_num, vehicle_type):
        """
        车辆信息识别
        根据阿里云官方文档：https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vehicle-information-identification
        接口名：VehicleQuery
        """
        params = {
            'ParamType': 'normal',  # 根据文档，需要ParamType参数
            'VehicleNum': vehicle_num,
            'VehicleType': vehicle_type
        }
        
        # 根据官方文档，使用 VehicleQuery 接口
        request_params = self._build_params('VehicleQuery', params)
        # 阿里云API需要使用完整的端点URL
        url = f'https://{self.endpoint}'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # 获取详细的错误信息
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            # 如果是 InvalidAction.NotFound 错误，提供更详细的提示
            if error_json.get('Code') == 'InvalidAction.NotFound':
                # 获取当前使用的Action名称
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'   建议使用区域端点：cloudauth.cn-shanghai.aliyuncs.com 或 cloudauth.cn-beijing.aliyuncs.com\n'
                    f'4. 是否已在阿里云控制台开通车辆核验服务\n'
                    f'建议：查看阿里云API文档确认正确的Action名称和版本\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def vehicle_insurance_date_query(self, vehicle_num, vehicle_type, vin):
        """
        车辆投保日期查询
        根据阿里云官方文档：https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vehicle-insurance-date-query
        接口名：VehicleInsureQuery
        
        参数说明：
        - ParamType: 必选，加密方式（normal或md5）
        - VIN: 必选，车辆识别代码
        - VehicleType: 可选，车辆类型
        - VehicleNum: 可选，车牌号
        """
        # 验证必选参数VIN
        if not vin:
            raise Exception('VIN（车辆识别码）是必选参数，不能为空')
        
        vin_cleaned = str(vin).strip()
        if not vin_cleaned:
            raise Exception('VIN（车辆识别码）是必选参数，不能为空或只包含空格')
        
        params = {
            'ParamType': 'normal',  # 根据文档，需要ParamType参数
            'VIN': vin_cleaned,  # 根据文档，参数名是VIN（大写）
        }
        
        # 可选参数：只有当值不为空时才添加
        if vehicle_type and str(vehicle_type).strip():
            params['VehicleType'] = str(vehicle_type).strip()
        if vehicle_num and str(vehicle_num).strip():
            params['VehicleNum'] = str(vehicle_num).strip()
        
        # 根据官方文档，使用 VehicleInsureQuery 接口
        request_params = self._build_params('VehicleInsureQuery', params)
        # 阿里云API需要使用完整的端点URL
        url = f'https://{self.endpoint}'
        
        # 调试：检查参数是否正确
        if 'VIN' not in request_params or not request_params.get('VIN'):
            raise Exception(f'VIN参数缺失或为空。参数列表: {list(request_params.keys())}, VIN值: {request_params.get("VIN")}')
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            # 获取详细的错误信息
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            # 如果是 InvalidAction.NotFound 错误，提供更详细的提示
            if error_json.get('Code') == 'InvalidAction.NotFound':
                # 获取当前使用的Action名称
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'   建议使用区域端点：cloudauth.cn-shanghai.aliyuncs.com 或 cloudauth.cn-beijing.aliyuncs.com\n'
                    f'4. 是否已在阿里云控制台开通车辆核验服务\n'
                    f'建议：查看阿里云API文档确认正确的Action名称和版本\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def mobile2_meta_verify(self, mobile, name):
        """
        手机号二要素核验（手机号+姓名）
        根据阿里云官方文档：https://next.api.aliyun.com/document/Cloudauth/2019-03-07/Mobile2MetaVerify
        Action: Mobile2MetaVerify
        """
        # 参数清理和验证
        mobile_cleaned = str(mobile).strip()
        name_cleaned = str(name).strip()
        
        if not mobile_cleaned:
            raise Exception('手机号不能为空')
        if not name_cleaned:
            raise Exception('姓名不能为空')
        
        # 验证手机号格式（11位数字，1开头）
        if not mobile_cleaned.isdigit() or len(mobile_cleaned) != 11 or not mobile_cleaned.startswith('1'):
            raise Exception('手机号格式不正确，应为11位数字且以1开头')
        
        # 验证姓名长度（通常2-20个字符）
        if len(name_cleaned) < 2 or len(name_cleaned) > 20:
            raise Exception('姓名长度应在2-20个字符之间')
        
        params = {
            'ParamType': 'normal',
            'Mobile': mobile_cleaned,
            'Name': name_cleaned
        }
        
        request_params = self._build_params('Mobile2MetaVerify', params)
        url = f'https://{self.endpoint}'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            if error_json.get('Code') == 'InvalidAction.NotFound':
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'4. 是否已在阿里云控制台开通实人认证服务\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def mobile3_meta_detail_standard_verify(self, mobile, name, identify_num):
        """
        手机号三要素核验（手机号+身份证+姓名）
        根据阿里云官方文档：https://next.api.aliyun.com/document/Cloudauth/2019-03-07/Mobile3MetaDetailStandardVerify
        Action: Mobile3MetaDetailStandardVerify
        """
        # 参数清理和验证
        mobile_cleaned = str(mobile).strip()
        name_cleaned = str(name).strip()
        identify_num_cleaned = str(identify_num).strip().upper()
        
        if not mobile_cleaned:
            raise Exception('手机号不能为空')
        if not name_cleaned:
            raise Exception('姓名不能为空')
        if not identify_num_cleaned:
            raise Exception('身份证号不能为空')
        
        # 验证手机号格式
        if not mobile_cleaned.isdigit() or len(mobile_cleaned) != 11 or not mobile_cleaned.startswith('1'):
            raise Exception('手机号格式不正确，应为11位数字且以1开头')
        
        # 验证姓名长度
        if len(name_cleaned) < 2 or len(name_cleaned) > 20:
            raise Exception('姓名长度应在2-20个字符之间')
        
        # 验证身份证号格式（18位，最后一位可以是X）
        if len(identify_num_cleaned) != 18:
            raise Exception('身份证号应为18位')
        if not (identify_num_cleaned[:17].isdigit() and (identify_num_cleaned[17].isdigit() or identify_num_cleaned[17] == 'X')):
            raise Exception('身份证号格式不正确')
        
        params = {
            'ParamType': 'normal',
            'Mobile': mobile_cleaned,
            'Name': name_cleaned,
            'IdentifyNum': identify_num_cleaned
        }
        
        request_params = self._build_params('Mobile3MetaDetailStandardVerify', params)
        url = f'https://{self.endpoint}'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            if error_json.get('Code') == 'InvalidAction.NotFound':
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'4. 是否已在阿里云控制台开通实人认证服务\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def mobile_online_time(self, mobile):
        """
        手机号在网状态查询
        根据阿里云官方文档：https://next.api.aliyun.com/document/Cloudauth/2019-03-07/MobileOnlineTime
        Action: MobileOnlineTime
        """
        # 参数清理和验证
        mobile_cleaned = str(mobile).strip()
        
        if not mobile_cleaned:
            raise Exception('手机号不能为空')
        
        # 验证手机号格式
        if not mobile_cleaned.isdigit() or len(mobile_cleaned) != 11 or not mobile_cleaned.startswith('1'):
            raise Exception('手机号格式不正确，应为11位数字且以1开头')
        
        params = {
            'ParamType': 'normal',
            'Mobile': mobile_cleaned
        }
        
        request_params = self._build_params('MobileOnlineTime', params)
        url = f'https://{self.endpoint}'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_detail = ''
            error_json = {}
            try:
                error_detail = response.text
                error_json = response.json()
            except:
                pass
            
            if error_json.get('Code') == 'InvalidAction.NotFound':
                current_action = request_params.get('Action', 'Unknown')
                raise Exception(
                    f'API Action未找到: {error_json.get("Message", "未知错误")}\n'
                    f'请检查：\n'
                    f'1. Action名称是否正确（当前使用: {current_action}）\n'
                    f'2. API版本是否正确（当前使用: {self.api_version}）\n'
                    f'3. 端点配置是否正确（当前使用: {self.endpoint}）\n'
                    f'4. 是否已在阿里云控制台开通实人认证服务\n'
                    f'响应详情: {error_detail}'
                )
            raise Exception(f'调用阿里云API失败: {str(e)} - 响应内容: {error_detail}')
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')


def call_aliyun_vehicle_verify(verify_type, data):
    """
    调用阿里云车辆核验API的统一入口
    verify_type: consistency, basicInfo, insuranceLog
    data: 包含姓名、身份证号、车牌号、车辆类型、VIN等信息
    """
    access_key_id = os.getenv('ALIYUN_ACCESS_KEY_ID', '')
    access_key_secret = os.getenv('ALIYUN_ACCESS_KEY_SECRET', '')
    # 根据官方SDK示例，默认使用上海区域端点
    endpoint = os.getenv('ALIYUN_ENDPOINT', 'cloudauth.cn-shanghai.aliyuncs.com')
    
    if not access_key_id or not access_key_secret:
        raise Exception('阿里云配置未设置，请设置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET')
    
    client = AliyunVehicleVerify(access_key_id, access_key_secret, endpoint)
    
    if verify_type == 'consistency':
        # 一致性核验
        user_name = data.get('name', '')
        identify_num = data.get('idCard', '')
        vehicle_num = data.get('plateNumber', '')
        vehicle_type = data.get('vehicleType', '')
        
        # 根据是否有身份证号决定使用二要素还是三要素核验
        if identify_num and identify_num.strip():
            # 有身份证号，使用三要素核验
            verify_meta_type = 'VEHICLE_3_META'
        else:
            # 没有身份证号，使用二要素核验
            verify_meta_type = 'VEHICLE_2_META'
        
        result = client.vehicle_meta_verify_v2(
            param_type='normal',
            verify_meta_type=verify_meta_type,
            user_name=user_name,
            vehicle_num=vehicle_num,
            identify_num=identify_num if identify_num and identify_num.strip() else None,
            vehicle_type=vehicle_type
        )
        
        # 解析返回结果
        if result.get('Code') == '200':
            result_object = result.get('ResultObject', {})
            return {
                'bizCode': result_object.get('BizCode', '3'),
                'vehicleInfo': result_object.get('VehicleInfo')
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    elif verify_type == 'basicInfo':
        # 基本信息查询
        vehicle_num = data.get('plateNumber', '')
        vehicle_type = data.get('vehicleType', '')
        
        result = client.vehicle_info_identification(
            vehicle_num=vehicle_num,
            vehicle_type=vehicle_type
        )
        
        if result.get('Code') == '200':
            return {
                'vehicleInfo': result.get('ResultObject', {})
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    elif verify_type == 'insuranceLog':
        # 投保日志查询
        vehicle_num = data.get('plateNumber', '')
        vehicle_type = data.get('vehicleType', '')
        vin = data.get('vin', '')
        
        # 验证必选参数
        if not vin or not vin.strip():
            raise Exception('VIN（车辆识别码）是必选参数，不能为空')
        
        result = client.vehicle_insurance_date_query(
            vehicle_num=vehicle_num,
            vehicle_type=vehicle_type,
            vin=vin
        )
        
        if result.get('Code') == '200':
            return {
                'insuranceLog': result.get('ResultObject', {})
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    else:
        raise Exception('不支持的核验类型')


def call_aliyun_phone_verify(verify_type, data):
    """
    调用阿里云手机号核验API的统一入口
    verify_type: mobile2Meta (手机号+姓名), mobile3Meta (手机号+身份证+姓名), mobileOnlineTime (手机号在网状态)
    data: 包含手机号、姓名、身份证号等信息
    """
    access_key_id = os.getenv('ALIYUN_ACCESS_KEY_ID', '')
    access_key_secret = os.getenv('ALIYUN_ACCESS_KEY_SECRET', '')
    endpoint = os.getenv('ALIYUN_ENDPOINT', 'cloudauth.cn-shanghai.aliyuncs.com')
    
    if not access_key_id or not access_key_secret:
        raise Exception('阿里云配置未设置，请设置 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET')
    
    client = AliyunVehicleVerify(access_key_id, access_key_secret, endpoint)
    
    if verify_type == 'mobile2Meta':
        # 手机号二要素核验（手机号+姓名）
        mobile = data.get('mobile', '').strip()
        name = data.get('name', '').strip()
        
        if not mobile:
            raise Exception('手机号是必填参数')
        if not name:
            raise Exception('姓名是必填参数')
        
        # 参数验证已在 mobile2_meta_verify 方法中完成，这里只做基本检查
        
        result = client.mobile2_meta_verify(mobile, name)
        
        # 解析返回结果
        if result.get('Code') == '200':
            result_object = result.get('ResultObject', {})
            biz_code = result_object.get('BizCode', '3')
            
            # 解析BizCode含义
            # 1: 一致（手机号和姓名匹配）
            # 2: 不一致（手机号和姓名不匹配）
            # 3: 无记录（无法查询到相关信息）
            biz_code_desc = {
                '1': '一致',
                '2': '不一致',
                '3': '无记录'
            }.get(biz_code, '未知')
            
            return {
                'bizCode': biz_code,
                'bizCodeDesc': biz_code_desc,
                'mobile': mobile,
                'name': name,
                'result': result_object,
                'verifyTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    elif verify_type == 'mobile3Meta':
        # 手机号三要素核验（手机号+身份证+姓名）
        mobile = data.get('mobile', '').strip()
        name = data.get('name', '').strip()
        identify_num = data.get('idCard', '').strip()
        
        if not mobile:
            raise Exception('手机号是必填参数')
        if not name:
            raise Exception('姓名是必填参数')
        if not identify_num:
            raise Exception('身份证号是必填参数')
        
        # 参数验证已在 mobile3_meta_detail_standard_verify 方法中完成，这里只做基本检查
        
        result = client.mobile3_meta_detail_standard_verify(mobile, name, identify_num)
        
        # 解析返回结果
        if result.get('Code') == '200':
            result_object = result.get('ResultObject', {})
            biz_code = result_object.get('BizCode', '3')
            
            # 解析BizCode含义
            # 1: 一致（手机号、身份证号和姓名三者匹配）
            # 2: 不一致（三者不匹配）
            # 3: 无记录（无法查询到相关信息）
            biz_code_desc = {
                '1': '一致',
                '2': '不一致',
                '3': '无记录'
            }.get(biz_code, '未知')
            
            return {
                'bizCode': biz_code,
                'bizCodeDesc': biz_code_desc,
                'mobile': mobile,
                'name': name,
                'idCard': identify_num,
                'result': result_object,
                'verifyTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    elif verify_type == 'mobileOnlineTime':
        # 手机号在网状态查询
        mobile = data.get('mobile', '').strip()
        
        if not mobile:
            raise Exception('手机号是必填参数')
        
        # 参数验证已在 mobile_online_time 方法中完成，这里只做基本检查
        
        result = client.mobile_online_time(mobile)
        
        # 解析返回结果
        if result.get('Code') == '200':
            result_object = result.get('ResultObject', {})
            
            # 提取在网状态信息
            # 根据阿里云文档，可能包含以下字段：
            # - OnlineStatus: 在网状态（1:在网, 2:不在网, 3:未知）
            # - OnlineTime: 在网时长（月）
            # - Carrier: 运营商
            online_status = result_object.get('OnlineStatus', '')
            online_time = result_object.get('OnlineTime', '')
            carrier = result_object.get('Carrier', '')
            
            # 解析在网状态描述
            status_desc = {
                '1': '在网',
                '2': '不在网',
                '3': '未知'
            }.get(str(online_status), '未知')
            
            return {
                'mobile': mobile,
                'onlineStatus': online_status,
                'onlineStatusDesc': status_desc,
                'onlineTime': online_time,
                'carrier': carrier,
                'result': result_object,
                'verifyTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        else:
            raise Exception(f"API调用失败: {result.get('Message', '未知错误')}")
    
    else:
        raise Exception('不支持的核验类型')

