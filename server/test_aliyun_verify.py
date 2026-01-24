#!/usr/bin/env python3
"""
阿里云车辆核验接口测试脚本

使用方法：
1. 确保 .env 文件中配置了阿里云密钥：
   ALIYUN_ACCESS_KEY_ID=your_access_key_id
   ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
   ALIYUN_ENDPOINT=cloudauth.aliyuncs.com

2. 运行测试：
   python3 test_aliyun_verify.py

3. 测试特定类型：
   python3 test_aliyun_verify.py --type consistency
   python3 test_aliyun_verify.py --type basicInfo
   python3 test_aliyun_verify.py --type insuranceLog
"""
import os
import sys
import argparse
from dotenv import load_dotenv
from vehicle_verify_helper import call_aliyun_vehicle_verify, AliyunVehicleVerify

# 加载环境变量
load_dotenv(override=True)

# 测试数据
TEST_DATA = {
    'consistency_2': {
        'name': '张三',
        'idCard': '',  # 二要素核验，不填身份证号
        'plateNumber': '京A12345',
        'vehicleType': '02'
    },
    'consistency_3': {
        'name': '张三',
        'idCard': '110101199001011234',  # 三要素核验，填写身份证号
        'plateNumber': '京A12345',
        'vehicleType': '02'
    },
    'basicInfo': {
        'plateNumber': '京A12345',
        'vehicleType': '02'
    },
    'insuranceLog': {
        'plateNumber': '京A12345',
        'vehicleType': '02',
        'vin': 'LSGBF53M8DS123456'  # 车辆识别码
    }
}

def test_consistency_verify(test_data, is_3_element=False):
    """测试一致性核验"""
    print("\n" + "=" * 60)
    print(f"测试一致性核验 ({'三要素' if is_3_element else '二要素'})")
    print("=" * 60)
    print(f"测试数据: {test_data}")
    
    try:
        result = call_aliyun_vehicle_verify('consistency', test_data)
        print("\n✓ 调用成功")
        print(f"返回结果: {result}")
        
        # 解析结果
        if 'bizCode' in result:
            biz_code = result['bizCode']
            if biz_code == '1':
                print("✓ 核验结果: 一致")
            elif biz_code == '2':
                print("✗ 核验结果: 不一致")
            elif biz_code == '3':
                print("⚠ 核验结果: 查无记录")
            else:
                print(f"⚠ 核验结果: 未知状态 (bizCode={biz_code})")
        
        if 'vehicleInfo' in result:
            print(f"车辆信息: {result['vehicleInfo']}")
        
        return True
    except Exception as e:
        print(f"\n✗ 调用失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_basic_info(test_data):
    """测试基本信息查询"""
    print("\n" + "=" * 60)
    print("测试基本信息查询")
    print("=" * 60)
    print(f"测试数据: {test_data}")
    
    try:
        result = call_aliyun_vehicle_verify('basicInfo', test_data)
        print("\n✓ 调用成功")
        print(f"返回结果: {result}")
        
        if 'vehicleInfo' in result:
            print(f"车辆信息: {result['vehicleInfo']}")
        
        return True
    except Exception as e:
        print(f"\n✗ 调用失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_insurance_log(test_data):
    """测试投保日志查询"""
    print("\n" + "=" * 60)
    print("测试投保日志查询")
    print("=" * 60)
    print(f"测试数据: {test_data}")
    
    try:
        result = call_aliyun_vehicle_verify('insuranceLog', test_data)
        print("\n✓ 调用成功")
        print(f"返回结果: {result}")
        
        if 'insuranceLog' in result:
            print(f"投保日志: {result['insuranceLog']}")
        
        return True
    except Exception as e:
        print(f"\n✗ 调用失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_direct_api_call():
    """直接测试 API 客户端"""
    print("\n" + "=" * 60)
    print("直接测试 API 客户端")
    print("=" * 60)
    
    access_key_id = os.getenv('ALIYUN_ACCESS_KEY_ID', '')
    access_key_secret = os.getenv('ALIYUN_ACCESS_KEY_SECRET', '')
    endpoint = os.getenv('ALIYUN_ENDPOINT', 'cloudauth.aliyuncs.com')
    
    if not access_key_id or not access_key_secret:
        print("✗ 阿里云配置未设置")
        return False
    
    try:
        client = AliyunVehicleVerify(access_key_id, access_key_secret, endpoint)
        
        # 测试签名
        print("测试签名功能...")
        test_params = {'Action': 'Test', 'TestParam': 'test'}
        signed_params = client._build_params('Test', test_params)
        print(f"✓ 签名成功，参数数量: {len(signed_params)}")
        
        return True
    except Exception as e:
        print(f"✗ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_config():
    """检查配置"""
    print("=" * 60)
    print("检查配置")
    print("=" * 60)
    
    access_key_id = os.getenv('ALIYUN_ACCESS_KEY_ID', '')
    access_key_secret = os.getenv('ALIYUN_ACCESS_KEY_SECRET', '')
    endpoint = os.getenv('ALIYUN_ENDPOINT', 'cloudauth.aliyuncs.com')
    
    print(f"ALIYUN_ACCESS_KEY_ID: {'✓ 已设置' if access_key_id else '✗ 未设置'}")
    print(f"ALIYUN_ACCESS_KEY_SECRET: {'✓ 已设置' if access_key_secret else '✗ 未设置'}")
    print(f"ALIYUN_ENDPOINT: {endpoint}")
    
    if not access_key_id or not access_key_secret:
        print("\n⚠️  请先配置阿里云密钥到 .env 文件")
        return False
    
    return True

def main():
    parser = argparse.ArgumentParser(description='测试阿里云车辆核验接口')
    parser.add_argument('--type', choices=['consistency', 'basicInfo', 'insuranceLog', 'all', 'config'],
                       default='all', help='测试类型')
    parser.add_argument('--element', choices=['2', '3'], default='2',
                       help='一致性核验要素数量（2或3）')
    
    args = parser.parse_args()
    
    # 检查配置
    if not check_config():
        sys.exit(1)
    
    if args.type == 'config':
        print("\n✓ 配置检查完成")
        return
    
    # 测试结果统计
    results = []
    
    if args.type == 'all' or args.type == 'consistency':
        # 测试一致性核验
        if args.element == '2':
            results.append(('一致性核验(二要素)', test_consistency_verify(TEST_DATA['consistency_2'], False)))
        else:
            results.append(('一致性核验(三要素)', test_consistency_verify(TEST_DATA['consistency_3'], True)))
    
    if args.type == 'all' or args.type == 'basicInfo':
        # 测试基本信息查询
        results.append(('基本信息查询', test_basic_info(TEST_DATA['basicInfo'])))
    
    if args.type == 'all' or args.type == 'insuranceLog':
        # 测试投保日志查询
        results.append(('投保日志查询', test_insurance_log(TEST_DATA['insuranceLog'])))
    
    # 直接测试 API 客户端
    if args.type == 'all':
        results.append(('API客户端', test_direct_api_call()))
    
    # 输出测试总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    for name, success in results:
        status = "✓ 通过" if success else "✗ 失败"
        print(f"{name}: {status}")
    
    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"\n总计: {passed}/{total} 通过")
    
    if passed == total:
        print("✓ 所有测试通过！")
        sys.exit(0)
    else:
        print("✗ 部分测试失败")
        sys.exit(1)

if __name__ == '__main__':
    main()

