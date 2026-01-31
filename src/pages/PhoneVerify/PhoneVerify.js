import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './PhoneVerify.css';

const PhoneVerify = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根据路由路径和URL参数确定初始验证类型
  const getInitialVerifyType = () => {
    if (location.pathname === '/phone-verify/online-time') {
      return 'mobileOnlineTime';
    }
    // 检查URL参数
    const urlParams = new URLSearchParams(location.search);
    const typeParam = urlParams.get('type');
    if (typeParam === 'mobile3Meta') {
      return 'mobile3Meta';
    }
    // 默认返回mobile2Meta
    return 'mobile2Meta';
  };
  
  const [verifyType, setVerifyType] = useState(getInitialVerifyType());
  const [formData, setFormData] = useState({
    mobile: '',
    name: '',
    idCard: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [price, setPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // 验证手机号格式
  const validateMobile = (mobile) => {
    const pattern = /^1[3-9]\d{9}$/;
    return pattern.test(mobile);
  };

  // 验证身份证号格式
  const validateIdCard = (idCard) => {
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return pattern.test(idCard);
  };

  // 表单验证
  const validateForm = () => {
    if (verifyType === 'mobile2Meta') {
      if (!formData.mobile) {
        setError(t('phoneVerify.errors.mobileRequired'));
        return false;
      }
      if (!validateMobile(formData.mobile)) {
        setError(t('phoneVerify.errors.mobileInvalid'));
        return false;
      }
      if (!formData.name) {
        setError(t('phoneVerify.errors.nameRequired'));
        return false;
      }
    } else if (verifyType === 'mobile3Meta') {
      if (!formData.mobile) {
        setError(t('phoneVerify.errors.mobileRequired'));
        return false;
      }
      if (!validateMobile(formData.mobile)) {
        setError(t('phoneVerify.errors.mobileInvalid'));
        return false;
      }
      if (!formData.name) {
        setError(t('phoneVerify.errors.nameRequired'));
        return false;
      }
      if (!formData.idCard) {
        setError(t('phoneVerify.errors.idCardRequired'));
        return false;
      }
      if (!validateIdCard(formData.idCard)) {
        setError(t('phoneVerify.errors.idCardInvalid'));
        return false;
      }
    } else if (verifyType === 'mobileOnlineTime') {
      if (!formData.mobile) {
        setError(t('phoneVerify.errors.mobileRequired'));
        return false;
      }
      if (!validateMobile(formData.mobile)) {
        setError(t('phoneVerify.errors.mobileInvalid'));
        return false;
      }
    }
    return true;
  };

  // 获取核验价格
  const getVerifyPrice = async (type, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data
        })
      });

      if (!response.ok) {
        throw new Error('获取价格失败');
      }

      const result = await response.json();
      return result.price;
    } catch (err) {
      console.error('获取价格错误:', err);
      return verifyType === 'mobileOnlineTime' ? 6.90 : 9.90;
    }
  };

  // 创建支付订单
  const createPaymentOrder = async (type, data, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          amount
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

  // 保存订单号到本地存储
  const saveOrderIdToLocal = (orderId) => {
    try {
      const orderIds = JSON.parse(localStorage.getItem('vehicleVerifyOrderIds') || '[]');
      const filteredIds = orderIds.filter(id => id !== orderId);
      filteredIds.unshift(orderId);
      if (filteredIds.length > 100) {
        filteredIds.pop();
      }
      localStorage.setItem('vehicleVerifyOrderIds', JSON.stringify(filteredIds));
    } catch (err) {
      console.error('保存订单号失败:', err);
    }
  };

  // 获取价格（当核验类型或表单数据变化时）
  useEffect(() => {
    const fetchPrice = async () => {
      if (verifyType === 'mobile2Meta' && formData.mobile && formData.name) {
        setPriceLoading(true);
        try {
          const currentPrice = await getVerifyPrice(verifyType, formData);
          setPrice(currentPrice);
        } catch (err) {
          console.error('获取价格失败:', err);
        } finally {
          setPriceLoading(false);
        }
      } else if (verifyType === 'mobile3Meta' && formData.mobile && formData.name && formData.idCard) {
        setPriceLoading(true);
        try {
          const currentPrice = await getVerifyPrice(verifyType, formData);
          setPrice(currentPrice);
        } catch (err) {
          console.error('获取价格失败:', err);
        } finally {
          setPriceLoading(false);
        }
      } else if (verifyType === 'mobileOnlineTime' && formData.mobile) {
        setPriceLoading(true);
        try {
          const currentPrice = await getVerifyPrice(verifyType, formData);
          setPrice(currentPrice);
        } catch (err) {
          console.error('获取价格失败:', err);
        } finally {
          setPriceLoading(false);
        }
      } else {
        setPrice(null);
      }
    };

    fetchPrice();
  }, [verifyType, formData.mobile, formData.name, formData.idCard]);

  // 处理核验/查询
  const handleVerify = async () => {
    setError('');
    setResult(null);

    if (!validateForm()) {
      return;
    }

    // 获取当前价格
    let currentPrice = price;
    if (!currentPrice) {
      try {
        currentPrice = await getVerifyPrice(verifyType, formData);
        setPrice(currentPrice);
      } catch (err) {
        console.error('获取价格失败:', err);
        currentPrice = verifyType === 'mobileOnlineTime' ? 6.90 : 9.90;
      }
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      // 1. 创建支付订单
      const orderResult = await createPaymentOrder(verifyType, formData, currentPrice);
      setOrderId(orderResult.orderId);
      setPaymentStatus('pending');

      // 2. 立即保存订单号到本地存储
      saveOrderIdToLocal(orderResult.orderId);

      // 3. 打开支付宝支付页面
      if (orderResult.paymentUrl) {
        window.open(orderResult.paymentUrl, '_blank');
      }

      // 4. 轮询检查支付状态
      let checkCount = 0;
      const maxChecks = 30;
      
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          const paymentResult = await checkPaymentStatus(orderResult.orderId);
          
          if (paymentResult.status === 'paid') {
            clearInterval(checkInterval);
            setPaymentStatus('paid');

            // 5. 支付成功后调用阿里云API
            try {
              const apiResult = await callAliyunAPI(verifyType, formData);
              setResult(apiResult);
              setLoading(false);
              
              // 跳转到订单详情页面
              navigate(`/vehicle-verify/orders?orderId=${orderResult.orderId}`);
            } catch (apiErr) {
              console.error('调用阿里云API错误:', apiErr);
              setError(apiErr.message || '查询失败');
              setLoading(false);
            }
          } else if (paymentResult.status === 'failed') {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('phoneVerify.errors.paymentError'));
            setLoading(false);
          } else if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('phoneVerify.errors.paymentError'));
            setLoading(false);
          }
        } catch (err) {
          console.error('检查支付状态错误:', err);
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('phoneVerify.errors.paymentError'));
            setLoading(false);
          }
        }
      }, 2000);
    } catch (err) {
      setError(err.message || t('phoneVerify.errors.networkError'));
      setLoading(false);
      setPaymentStatus('failed');
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      mobile: '',
      name: '',
      idCard: ''
    });
    setResult(null);
    setError('');
    setOrderId('');
    setPaymentStatus('');
    setPrice(null);
  };
  
  // 监听路由变化，更新验证类型
  useEffect(() => {
    const newType = getInitialVerifyType();
    if (newType !== verifyType) {
      setVerifyType(newType);
      setFormData({
        mobile: '',
        name: '',
        idCard: ''
      });
      setResult(null);
      setError('');
      setOrderId('');
      setPaymentStatus('');
      setPrice(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Helmet>
        <title>{t('phoneVerify.title')} - CUTool</title>
      </Helmet>
      <div className="phone-verify-container">
        {/* 核验类型导航栏 */}
        <div className="verify-type-nav">
          <div className="type-nav-items">
            <button
              className={`type-nav-item ${verifyType === 'mobile2Meta' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('mobile2Meta');
                handleReset();
                navigate('/phone-verify');
              }}
            >
              {t('phoneVerify.verifyType.mobile2Meta')}
            </button>
            <button
              className={`type-nav-item ${verifyType === 'mobile3Meta' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('mobile3Meta');
                handleReset();
                navigate('/phone-verify?type=mobile3Meta');
              }}
            >
              {t('phoneVerify.verifyType.mobile3Meta')}
            </button>
            <button
              className={`type-nav-item ${verifyType === 'mobileOnlineTime' ? 'active' : ''}`}
              onClick={() => {
                setVerifyType('mobileOnlineTime');
                handleReset();
                navigate('/phone-verify/online-time');
              }}
            >
              {t('phoneVerify.verifyType.mobileOnlineTime')}
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="phone-verify-content">
          {/* 类型说明 */}
          <div className="type-description-box">
            <div className="type-description-icon">ℹ️</div>
            <div className="type-description-text">
              {verifyType === 'mobile2Meta' && t('phoneVerify.description.mobile2Meta')}
              {verifyType === 'mobile3Meta' && t('phoneVerify.description.mobile3Meta')}
              {verifyType === 'mobileOnlineTime' && t('phoneVerify.description.mobileOnlineTime')}
            </div>
          </div>

          {/* 表单 */}
          <div className="verify-form">
            {verifyType !== 'mobileOnlineTime' && (
              <div className="form-group">
                <label>
                  {t('phoneVerify.form.name')}
                  <span className="required-mark">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('phoneVerify.form.namePlaceholder')}
                  className={!formData.name ? 'required-field' : ''}
                />
                <div className="field-description">{t('phoneVerify.form.nameDescription')}</div>
              </div>
            )}

            {verifyType === 'mobile3Meta' && (
              <div className="form-group">
                <label>
                  {t('phoneVerify.form.idCard')}
                  <span className="required-mark">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idCard}
                  onChange={(e) => handleInputChange('idCard', e.target.value.toUpperCase())}
                  placeholder={t('phoneVerify.form.idCardPlaceholder')}
                  maxLength={18}
                  className={!formData.idCard ? 'required-field' : ''}
                />
                <div className="field-description">{t('phoneVerify.form.idCardDescription')}</div>
              </div>
            )}

            <div className="form-group">
              <label>
                {t('phoneVerify.form.mobile')}
                <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder={t('phoneVerify.form.mobilePlaceholder')}
                maxLength={11}
                className={!formData.mobile ? 'required-field' : ''}
              />
              <div className="field-description">{t('phoneVerify.form.mobileDescription')}</div>
            </div>

            {/* 价格显示 */}
            {price !== null && (
              <div className="price-display">
                <span className="price-label">{t('phoneVerify.payment.amount')}:</span>
                <span className="price-value">¥{price.toFixed(2)}</span>
                {priceLoading && <span className="price-loading">（加载中...）</span>}
              </div>
            )}

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading || priceLoading}
              >
                {loading ? t('phoneVerify.result.loading') : t('phoneVerify.form.verifyButton')}
              </button>
              <button
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                {t('phoneVerify.form.resetButton')}
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
              <p>{t('phoneVerify.payment.waiting')}</p>
            </div>
          )}

          {/* 结果展示 */}
          {result && (
            <div className="verify-result">
              <h2>{t('phoneVerify.result.title')}</h2>
              
              {/* 二要素/三要素核验结果 */}
              {(verifyType === 'mobile2Meta' || verifyType === 'mobile3Meta') && result.bizCode && (
                <div className="result-status">
                  {result.bizCode === '1' && (
                    <div className="status-success">
                      <span className="status-icon">✓</span>
                      <span className="status-text">{result.bizCodeDesc || t('phoneVerify.result.consistent')}</span>
                    </div>
                  )}
                  {result.bizCode === '2' && (
                    <div className="status-error">
                      <span className="status-icon">✗</span>
                      <span className="status-text">{result.bizCodeDesc || t('phoneVerify.result.inconsistent')}</span>
                    </div>
                  )}
                  {result.bizCode === '3' && (
                    <div className="status-warning">
                      <span className="status-icon">?</span>
                      <span className="status-text">{result.bizCodeDesc || t('phoneVerify.result.noRecord')}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* 在网状态查询结果 */}
              {verifyType === 'mobileOnlineTime' && result.onlineStatus && (
                <div className="result-status">
                  <div className={`status-${result.onlineStatus === '1' ? 'success' : result.onlineStatus === '2' ? 'error' : 'warning'}`}>
                    <span className="status-icon">
                      {result.onlineStatus === '1' ? '✓' : result.onlineStatus === '2' ? '✗' : '?'}
                    </span>
                    <span className="status-text">
                      {t('phoneVerify.result.onlineStatus')}: {result.onlineStatusDesc || '未知'}
                    </span>
                  </div>
                  {result.onlineTime && (
                    <div className="result-detail">
                      {t('phoneVerify.result.onlineTime')}: {result.onlineTime} {t('phoneVerify.result.months')}
                    </div>
                  )}
                  {result.carrier && (
                    <div className="result-detail">
                      {t('phoneVerify.result.carrier')}: {result.carrier}
                    </div>
                  )}
                </div>
              )}
              
              {/* 核验信息 */}
              <div className="verify-info">
                {result.mobile && (
                  <div className="info-item">
                    <span className="info-label">{t('phoneVerify.form.mobile')}:</span>
                    <span className="info-value">{result.mobile}</span>
                  </div>
                )}
                {result.name && (
                  <div className="info-item">
                    <span className="info-label">{t('phoneVerify.form.name')}:</span>
                    <span className="info-value">{result.name}</span>
                  </div>
                )}
                {result.idCard && (
                  <div className="info-item">
                    <span className="info-label">{t('phoneVerify.form.idCard')}:</span>
                    <span className="info-value">{result.idCard}</span>
                  </div>
                )}
                {result.verifyTime && (
                  <div className="info-item">
                    <span className="info-label">{t('phoneVerify.result.verifyTime')}:</span>
                    <span className="info-value">{result.verifyTime}</span>
                  </div>
                )}
              </div>
              
              {/* 详细结果（可展开） */}
              {result.result && (
                <details className="result-details">
                  <summary>{t('phoneVerify.result.details')}</summary>
                  <pre>{JSON.stringify(result.result, null, 2)}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PhoneVerify;

