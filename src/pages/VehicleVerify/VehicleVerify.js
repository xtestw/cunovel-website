import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';
import './VehicleVerify.css';

const VehicleVerify = () => {
  const { t } = useTranslation();
  const [verifyType, setVerifyType] = useState('consistency');
  const [formData, setFormData] = useState({
    name: '',
    idCard: '',
    plateNumber: '',
    vehicleType: '',
    vin: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // pending, paid, failed
  const [plateNumberError, setPlateNumberError] = useState('');
  const [isComposing, setIsComposing] = useState(false); // 用于处理中文输入法

  // 验证身份证号格式
  const validateIdCard = (idCard) => {
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return pattern.test(idCard);
  };

  // 车牌号省份简称
  const provinceCodes = ['京', '津', '沪', '渝', '冀', '豫', '云', '辽', '黑', '湘', '皖', '鲁', '新', '苏', '浙', '赣', '鄂', '桂', '甘', '晋', '蒙', '陕', '吉', '闽', '贵', '粤', '青', '藏', '川', '宁', '琼', '使', '领'];
  
  // 格式化车牌号（保留中文省份简称，其他转换为大写）
  const formatPlateNumber = (value) => {
    if (!value) return '';
    
    // 移除所有空格和特殊字符，但保留中文字符
    let cleaned = value.replace(/[\s\-_]/g, '');
    
    // 限制长度（最多8个字符：省份1位+字母1位+数字字母5-6位）
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }
    
    // 处理：第一位如果是中文省份简称，保持不变；第二位及之后如果是字母，转换为大写
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      // 如果是中文字符（省份简称），保持不变
      if (/[\u4e00-\u9fa5]/.test(char)) {
        formatted += char;
      } else if (/[a-zA-Z]/.test(char)) {
        // 如果是字母，转换为大写
        formatted += char.toUpperCase();
      } else {
        // 数字等其他字符保持不变
        formatted += char;
      }
    }
    
    return formatted;
  };

  // 验证车牌号格式
  const validatePlateNumber = (plateNumber) => {
    if (!plateNumber) return false;
    
    // 移除空格后验证
    const cleaned = plateNumber.replace(/\s/g, '');
    
    // 标准格式：省份1位（中文）+ 字母1位 + 数字字母5-6位 + 可选后缀1位
    // 简化验证：至少7位，最多8位
    if (cleaned.length < 7 || cleaned.length > 8) {
      return false;
    }
    
    // 验证第一位是省份代码（中文）
    if (!provinceCodes.includes(cleaned[0])) {
      return false;
    }
    
    // 验证第二位是字母（不区分大小写，但会转换为大写）
    if (!/^[A-Za-z]$/.test(cleaned[1])) {
      return false;
    }
    
    // 验证后续字符（3-7位或3-8位）是字母或数字（排除I和O）
    const middlePart = cleaned.substring(2, cleaned.length - 1);
    if (!/^[A-HJ-NP-Z0-9a-hj-np-z]+$/.test(middlePart) || middlePart.length < 4 || middlePart.length > 5) {
      return false;
    }
    
    // 验证最后一位（如果有8位）
    if (cleaned.length === 8) {
      const lastChar = cleaned[cleaned.length - 1];
      if (!/^[A-HJ-NP-Z0-9a-hj-np-z挂学警港澳]$/.test(lastChar)) {
        return false;
      }
    }
    
    return true;
  };

  // 获取车牌号格式提示
  const getPlateNumberHint = () => {
    return '格式：省份简称 + 字母 + 5-6位数字/字母，如：京A12345、粤B12345A';
  };

  // 处理车牌号输入变化（实时验证和格式化）
  const handlePlateNumberChange = (value) => {
    // 如果正在使用输入法输入中文，不进行格式化，直接更新
    if (isComposing) {
      handleInputChange('plateNumber', value);
      return;
    }
    
    const formatted = formatPlateNumber(value);
    handleInputChange('plateNumber', formatted);
    
    // 实时验证
    if (formatted && formatted.length > 0) {
      if (formatted.length < 7) {
        setPlateNumberError('车牌号长度不足，请输入完整的车牌号');
      } else if (!validatePlateNumber(formatted)) {
        setPlateNumberError('车牌号格式不正确，请检查输入');
      } else {
        setPlateNumberError('');
      }
    } else {
      setPlateNumberError('');
    }
  };

  // 处理中文输入法开始
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // 处理中文输入法结束
  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    // 输入法结束后，对输入的内容进行格式化
    handlePlateNumberChange(e.target.value);
  };

  // 验证VIN码格式（17位字母数字）
  const validateVin = (vin) => {
    const pattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    return pattern.test(vin);
  };

  // 表单验证
  const validateForm = () => {
    if (verifyType === 'consistency') {
      if (!formData.name) {
        setError(t('vehicleVerify.errors.nameRequired'));
        return false;
      }
      // 身份证号是可选的，如果填写了则验证格式
      if (formData.idCard && !validateIdCard(formData.idCard)) {
        setError(t('vehicleVerify.errors.idCardInvalid'));
        return false;
      }
      if (!formData.plateNumber) {
        setError(t('vehicleVerify.errors.plateNumberRequired'));
        return false;
      }
      if (!validatePlateNumber(formData.plateNumber)) {
        setError(t('vehicleVerify.errors.plateNumberInvalid'));
        return false;
      }
      if (!formData.vehicleType) {
        setError(t('vehicleVerify.errors.vehicleTypeRequired'));
        return false;
      }
    } else if (verifyType === 'basicInfo') {
      if (!formData.plateNumber) {
        setError(t('vehicleVerify.errors.plateNumberRequired'));
        return false;
      }
      if (!validatePlateNumber(formData.plateNumber)) {
        setError(t('vehicleVerify.errors.plateNumberInvalid'));
        return false;
      }
      if (!formData.vehicleType) {
        setError(t('vehicleVerify.errors.vehicleTypeRequired'));
        return false;
      }
    } else if (verifyType === 'insuranceLog') {
      if (!formData.plateNumber) {
        setError(t('vehicleVerify.errors.plateNumberRequired'));
        return false;
      }
      if (!validatePlateNumber(formData.plateNumber)) {
        setError(t('vehicleVerify.errors.plateNumberInvalid'));
        return false;
      }
      if (!formData.vehicleType) {
        setError(t('vehicleVerify.errors.vehicleTypeRequired'));
        return false;
      }
      if (!formData.vin) {
        setError(t('vehicleVerify.errors.vinRequired'));
        return false;
      }
      if (!validateVin(formData.vin)) {
        setError(t('vehicleVerify.errors.vinInvalid'));
        return false;
      }
    }
    return true;
  };

  // 创建支付订单
  const createPaymentOrder = async (type, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          amount: 1.00 // 固定金额1元，可根据实际情况调整
        })
      });

      if (!response.ok) {
        throw new Error('创建订单失败');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('创建订单错误:', err);
      throw err;
    }
  };

  // 检查支付状态
  const checkPaymentStatus = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/check-payment/${orderId}`);
      if (!response.ok) {
        throw new Error('查询支付状态失败');
      }
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('查询支付状态错误:', err);
      throw err;
    }
  };

  // 调用阿里云API
  const callAliyunAPI = async (type, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          orderId
        })
      });

      if (!response.ok) {
        throw new Error('接口调用失败');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('接口调用错误:', err);
      throw err;
    }
  };

  // 保存订单到本地存储
  const saveOrderToLocal = (order) => {
    try {
      const orders = JSON.parse(localStorage.getItem('vehicleVerifyOrders') || '[]');
      orders.unshift(order); // 添加到开头
      // 只保留最近100条订单
      if (orders.length > 100) {
        orders.pop();
      }
      localStorage.setItem('vehicleVerifyOrders', JSON.stringify(orders));
    } catch (err) {
      console.error('保存订单失败:', err);
    }
  };

  // 处理核验/查询
  const handleVerify = async () => {
    setError('');
    setResult(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      // 1. 创建支付订单
      const orderResult = await createPaymentOrder(verifyType, formData);
      setOrderId(orderResult.orderId);
      setPaymentStatus('pending');

      // 2. 打开支付宝支付页面
      if (orderResult.paymentUrl) {
        window.open(orderResult.paymentUrl, '_blank');
      }

      // 3. 轮询检查支付状态
      let checkCount = 0;
      const maxChecks = 30; // 最多检查30次（60秒）
      
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          const paymentResult = await checkPaymentStatus(orderResult.orderId);
          
          if (paymentResult.status === 'paid') {
            clearInterval(checkInterval);
            setPaymentStatus('paid');

            // 4. 支付成功后调用阿里云API
            const apiResult = await callAliyunAPI(verifyType, formData);
            setResult(apiResult);
            setLoading(false);

            // 5. 保存订单到本地存储
            saveOrderToLocal({
              orderId: orderResult.orderId,
              type: verifyType,
              status: 'completed',
              amount: orderResult.amount,
              createTime: new Date().toISOString(),
              payTime: new Date().toISOString(),
              data: formData,
              result: apiResult
            });
          } else if (paymentResult.status === 'failed') {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('vehicleVerify.errors.paymentError'));
            setLoading(false);
          } else if (checkCount >= maxChecks) {
            // 超过最大检查次数，停止检查
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('vehicleVerify.errors.paymentError'));
            setLoading(false);
          }
        } catch (err) {
          console.error('检查支付状态错误:', err);
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('vehicleVerify.errors.paymentError'));
            setLoading(false);
          }
        }
      }, 2000); // 每2秒检查一次
    } catch (err) {
      setError(err.message || t('vehicleVerify.errors.networkError'));
      setLoading(false);
      setPaymentStatus('failed');
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      name: '',
      idCard: '',
      plateNumber: '',
      vehicleType: '',
      vin: ''
    });
    setResult(null);
    setError('');
    setOrderId('');
    setPaymentStatus('');
    setPlateNumberError('');
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 获取字段是否必填
  const isFieldRequired = (fieldName) => {
    if (verifyType === 'consistency') {
      // 身份证号是可选的
      return ['name', 'plateNumber', 'vehicleType'].includes(fieldName);
    } else if (verifyType === 'basicInfo') {
      return ['plateNumber', 'vehicleType'].includes(fieldName);
    } else if (verifyType === 'insuranceLog') {
      return ['plateNumber', 'vehicleType', 'vin'].includes(fieldName);
    }
    return false;
  };

  // 获取字段是否显示
  const isFieldVisible = (fieldName) => {
    if (verifyType === 'consistency') {
      // 身份证号是可选的，始终显示
      return ['name', 'idCard', 'plateNumber', 'vehicleType'].includes(fieldName);
    } else if (verifyType === 'basicInfo') {
      return ['plateNumber', 'vehicleType'].includes(fieldName);
    } else if (verifyType === 'insuranceLog') {
      return ['plateNumber', 'vehicleType', 'vin'].includes(fieldName);
    }
    return false;
  };

  // 获取字段说明
  const getFieldDescription = (fieldName) => {
    const descriptions = {
      name: '请输入真实姓名',
      idCard: '请输入18位身份证号码',
      plateNumber: getPlateNumberHint(),
      vehicleType: '请选择车辆类型',
      vin: '请输入17位车辆识别码（VIN）'
    };
    return descriptions[fieldName] || '';
  };

  return (
    <>
      <Helmet>
        <title>{t('vehicleVerify.title')} - CUTool</title>
      </Helmet>
      <div className="vehicle-verify-container">
        {/* 核验类型导航栏 */}
        <div className="verify-type-nav">
          <div className="type-nav-items">
            <button
              className={`type-nav-item ${verifyType === 'consistency' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('consistency');
                handleReset();
              }}
            >
              {t('vehicleVerify.verifyType.consistency')}
            </button>
            <button
              className={`type-nav-item ${verifyType === 'basicInfo' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('basicInfo');
                handleReset();
              }}
            >
              {t('vehicleVerify.verifyType.basicInfo')}
            </button>
            <button
              className={`type-nav-item ${verifyType === 'insuranceLog' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('insuranceLog');
                handleReset();
              }}
            >
              {t('vehicleVerify.verifyType.insuranceLog')}
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="vehicle-verify-content">
          {/* 类型说明 */}
          <div className="type-description-box">
            <div className="type-description-icon">ℹ️</div>
            <div className="type-description-text">
              {verifyType === 'consistency' && '核验姓名、车牌号、车辆类型是否一致（身份证号选填，填写后为三要素核验）'}
              {verifyType === 'basicInfo' && '通过车牌号和车辆类型查询车辆基本信息'}
              {verifyType === 'insuranceLog' && '通过车牌号、车辆类型和VIN查询车辆投保日志'}
            </div>
          </div>

          {/* 表单 */}
          <div className="verify-form">
            
            {isFieldVisible('name') && (
              <div className="form-group">
                <label>
                  {t('vehicleVerify.form.name')}
                  {isFieldRequired('name') && <span className="required-mark">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('vehicleVerify.form.namePlaceholder')}
                  className={isFieldRequired('name') && !formData.name ? 'required-field' : ''}
                />
                <div className="field-description">{getFieldDescription('name')}</div>
              </div>
            )}

            {isFieldVisible('idCard') && (
              <div className="form-group">
                <label>
                  {t('vehicleVerify.form.idCard')}
                  {isFieldRequired('idCard') && <span className="required-mark">*</span>}
                  {!isFieldRequired('idCard') && <span className="optional-mark">（选填）</span>}
                </label>
                <input
                  type="text"
                  value={formData.idCard}
                  onChange={(e) => handleInputChange('idCard', e.target.value)}
                  placeholder={verifyType === 'consistency' ? '选填，填写后为三要素核验' : t('vehicleVerify.form.idCardPlaceholder')}
                  maxLength={18}
                  className={isFieldRequired('idCard') && !formData.idCard ? 'required-field' : ''}
                />
                <div className="field-description">
                  {verifyType === 'consistency' 
                    ? '选填，填写身份证号将进行三要素核验（姓名+身份证号+车牌号），不填写则进行二要素核验（姓名+车牌号）'
                    : getFieldDescription('idCard')}
                </div>
              </div>
            )}

            {isFieldVisible('plateNumber') && (
              <div className="form-group">
                <label>
                  {t('vehicleVerify.form.plateNumber')}
                  {isFieldRequired('plateNumber') && <span className="required-mark">*</span>}
                </label>
                <div className="plate-number-input-wrapper">
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => handlePlateNumberChange(e.target.value)}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    placeholder={t('vehicleVerify.form.plateNumberPlaceholder')}
                    className={`plate-number-input ${isFieldRequired('plateNumber') && !formData.plateNumber ? 'required-field' : ''} ${plateNumberError ? 'error-field' : ''} ${formData.plateNumber && validatePlateNumber(formData.plateNumber) ? 'valid-field' : ''}`}
                    maxLength={8}
                  />
                  {formData.plateNumber && validatePlateNumber(formData.plateNumber) && (
                    <span className="input-status-icon valid-icon">✓</span>
                  )}
                  {plateNumberError && (
                    <span className="input-status-icon error-icon">✗</span>
                  )}
                </div>
                {plateNumberError ? (
                  <div className="field-error">{plateNumberError}</div>
                ) : (
                  <div className="field-description">{getPlateNumberHint()}</div>
                )}
                <div className="plate-number-examples">
                  <span className="example-label">示例：</span>
                  <span className="example-item" onClick={() => handlePlateNumberChange('京A12345')}>京A12345</span>
                  <span className="example-item" onClick={() => handlePlateNumberChange('粤B12345A')}>粤B12345A</span>
                  <span className="example-item" onClick={() => handlePlateNumberChange('沪C12345')}>沪C12345</span>
                </div>
              </div>
            )}

            {isFieldVisible('vehicleType') && (
              <div className="form-group">
                <label>
                  {t('vehicleVerify.form.vehicleType')}
                  {isFieldRequired('vehicleType') && <span className="required-mark">*</span>}
                </label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className={isFieldRequired('vehicleType') && !formData.vehicleType ? 'required-field' : ''}
                >
                  <option value="">{t('vehicleVerify.form.vehicleTypePlaceholder')}</option>
                  <option value="02">{t('vehicleVerify.form.vehicleTypeOptions.02')}</option>
                  <option value="52">{t('vehicleVerify.form.vehicleTypeOptions.52')}</option>
                </select>
                <div className="field-description">{getFieldDescription('vehicleType')}</div>
              </div>
            )}

            {isFieldVisible('vin') && (
              <div className="form-group">
                <label>
                  {t('vehicleVerify.form.vin')}
                  {isFieldRequired('vin') && <span className="required-mark">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                  placeholder={t('vehicleVerify.form.vinPlaceholder')}
                  maxLength={17}
                  className={isFieldRequired('vin') && !formData.vin ? 'required-field' : ''}
                />
                <div className="field-description">{getFieldDescription('vin')}</div>
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? t('vehicleVerify.result.loading') : 
                 verifyType === 'consistency' ? t('vehicleVerify.form.verifyButton') : 
                 t('vehicleVerify.form.queryButton')}
              </button>
              <button
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                {t('vehicleVerify.form.resetButton')}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 支付状态 */}
          {paymentStatus === 'pending' && (
            <div className="payment-status">
              <p>{t('vehicleVerify.payment.waiting')}</p>
            </div>
          )}

          {/* 结果展示 */}
          {result && (
            <div className="verify-result">
              <h2>{t('vehicleVerify.result.title')}</h2>
              {result.bizCode && (
                <div className="result-status">
                  {result.bizCode === '1' && (
                    <div className="status-success">
                      {t('vehicleVerify.result.consistent')}
                    </div>
                  )}
                  {result.bizCode === '2' && (
                    <div className="status-error">
                      {t('vehicleVerify.result.inconsistent')}
                    </div>
                  )}
                  {result.bizCode === '3' && (
                    <div className="status-warning">
                      {t('vehicleVerify.result.noRecord')}
                    </div>
                  )}
                </div>
              )}
              {result.vehicleInfo && (
                <div className="vehicle-info">
                  <h3>{t('vehicleVerify.result.vehicleInfo')}</h3>
                  <pre>{JSON.stringify(result.vehicleInfo, null, 2)}</pre>
                </div>
              )}
              {result.insuranceLog && (
                <div className="insurance-log">
                  <h3>{t('vehicleVerify.result.insuranceLog')}</h3>
                  <pre>{JSON.stringify(result.insuranceLog, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VehicleVerify;

