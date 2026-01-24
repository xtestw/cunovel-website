"""
车辆信息核验辅助函数
用于调用阿里云车辆核验API
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

class AliyunVehicleVerify:
    """阿里云车辆核验API客户端"""
    
    def __init__(self, access_key_id, access_key_secret, endpoint='cloudauth.aliyuncs.com'):
        self.access_key_id = access_key_id
        self.access_key_secret = access_key_secret
        self.endpoint = endpoint
        self.api_version = '2022-11-25'
    
    def _sign_request(self, params):
        """签名请求参数"""
        # 按参数名排序
        sorted_params = sorted(params.items())
        # 构建查询字符串
        query_string = '&'.join([f'{k}={urllib.parse.quote(str(v), safe="")}' for k, v in sorted_params])
        # 构建待签名字符串
        string_to_sign = f'GET&%2F&{urllib.parse.quote(query_string, safe="")}'
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
        # 添加签名
        signature = self._sign_request(common_params)
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
        
        request_params = self._build_params('VehicleMetaVerifyV2', params)
        url = f'https://{self.endpoint}/'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def vehicle_info_identification(self, vehicle_num, vehicle_type):
        """
        车辆信息识别
        """
        params = {
            'VehicleNum': vehicle_num,
            'VehicleType': vehicle_type
        }
        
        request_params = self._build_params('VehicleInfoIdentification', params)
        url = f'https://{self.endpoint}/'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f'调用阿里云API失败: {str(e)}')
    
    def vehicle_insurance_date_query(self, vehicle_num, vehicle_type, vin):
        """
        车辆投保日期查询
        """
        params = {
            'VehicleNum': vehicle_num,
            'VehicleType': vehicle_type,
            'Vin': vin
        }
        
        request_params = self._build_params('VehicleInsuranceDateQuery', params)
        url = f'https://{self.endpoint}/'
        
        try:
            response = requests.get(url, params=request_params, timeout=30)
            response.raise_for_status()
            return response.json()
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
    endpoint = os.getenv('ALIYUN_ENDPOINT', 'cloudauth.aliyuncs.com')
    
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

