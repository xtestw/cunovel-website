import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './BankCardVerify.css';

const BankCardVerify = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bankCardNo: '',
    name: '',
    idCard: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // pending, paid, failed
  const [price, setPrice] = useState(null); // 当前核验类型的价格
  const [priceLoading, setPriceLoading] = useState(false); // 价格加载状态

  // 验证身份证号格式
  const validateIdCard = (idCard) => {
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    return pattern.test(idCard);
  };

  // 验证银行卡号格式（16-19位数字）
  const validateBankCardNo = (bankCardNo) => {
    const cleaned = bankCardNo.replace(/\s/g, '');
    return /^\d{16,19}$/.test(cleaned);
  };

  // 格式化银行卡号（每4位加一个空格）
  const formatBankCardNo = (value) => {
    if (!value) return '';
    // 移除所有空格
    const cleaned = value.replace(/\s/g, '');
    // 只保留数字
    const digits = cleaned.replace(/\D/g, '');
    // 限制长度（最多19位）
    const limited = digits.substring(0, 19);
    // 每4位加一个空格
    return limited.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // 表单验证
  const validateForm = () => {
    if (!formData.bankCardNo) {
      setError(t('bankCardVerify.errors.bankCardNoRequired'));
      return false;
    }
    const cleanedCardNo = formData.bankCardNo.replace(/\s/g, '');
    if (!validateBankCardNo(cleanedCardNo)) {
      setError(t('bankCardVerify.errors.bankCardNoInvalid'));
      return false;
    }
    if (!formData.name) {
      setError(t('bankCardVerify.errors.nameRequired'));
      return false;
    }
    if (formData.name.length < 2 || formData.name.length > 20) {
      setError('姓名长度应在2-20个字符之间');
      return false;
    }
    if (!formData.idCard) {
      setError(t('bankCardVerify.errors.idCardRequired'));
      return false;
    }
    if (!validateIdCard(formData.idCard)) {
      setError(t('bankCardVerify.errors.idCardInvalid'));
      return false;
    }
    return true;
  };

  // 获取核验价格
  const getVerifyPrice = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'bankCardVerify',
          data: formData
        })
      });

      if (!response.ok) {
        throw new Error('获取价格失败');
      }

      const result = await response.json();
      return result.price;
    } catch (err) {
      console.error('获取价格错误:', err);
      // 如果获取价格失败，返回默认价格
      return 19.90;
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
          amount // 使用传入的价格
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
      // 如果订单号已存在，先移除（避免重复）
      const filteredIds = orderIds.filter(id => id !== orderId);
      // 添加到开头
      filteredIds.unshift(orderId);
      // 只保留最近100条订单号
      if (filteredIds.length > 100) {
        filteredIds.pop();
      }
      localStorage.setItem('vehicleVerifyOrderIds', JSON.stringify(filteredIds));
    } catch (err) {
      console.error('保存订单号失败:', err);
    }
  };

  // 获取价格（当表单数据变化时）
  useEffect(() => {
    const fetchPrice = async () => {
      // 只有在表单有基本数据时才获取价格
      if (formData.bankCardNo && formData.name && formData.idCard) {
        setPriceLoading(true);
        try {
          const currentPrice = await getVerifyPrice();
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
  }, [formData.bankCardNo, formData.name, formData.idCard]);

  // 处理核验
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
        currentPrice = await getVerifyPrice();
        setPrice(currentPrice);
      } catch (err) {
        console.error('获取价格失败:', err);
        currentPrice = 19.90; // 默认价格
      }
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      // 准备表单数据（银行卡号需要移除空格）
      const submitData = {
        bankCardNo: formData.bankCardNo.replace(/\s/g, ''),
        name: formData.name.trim(),
        idCard: formData.idCard.trim().toUpperCase()
      };

      // 1. 创建支付订单（使用获取到的价格）
      const orderResult = await createPaymentOrder('bankCardVerify', submitData, currentPrice);
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
      const maxChecks = 30; // 最多检查30次（60秒）
      
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          const paymentResult = await checkPaymentStatus(orderResult.orderId);
          
          if (paymentResult.status === 'paid') {
            clearInterval(checkInterval);
            setPaymentStatus('paid');
            setLoading(false);

            // 5. 支付成功后跳转到查询结果页面（后端会自动查询阿里云接口）
            navigate(`/verify-result?orderId=${orderResult.orderId}`);
          } else if (paymentResult.status === 'failed') {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('bankCardVerify.errors.paymentError'));
            setLoading(false);
          } else if (checkCount >= maxChecks) {
            // 超过最大检查次数，停止检查
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('bankCardVerify.errors.paymentError'));
            setLoading(false);
          }
        } catch (err) {
          console.error('检查支付状态错误:', err);
          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setPaymentStatus('failed');
            setError(t('bankCardVerify.errors.paymentError'));
            setLoading(false);
          }
        }
      }, 2000); // 每2秒检查一次
    } catch (err) {
      setError(err.message || t('bankCardVerify.errors.networkError'));
      setLoading(false);
      setPaymentStatus('failed');
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      bankCardNo: '',
      name: '',
      idCard: ''
    });
    setResult(null);
    setError('');
    setOrderId('');
    setPaymentStatus('');
  };

  // 处理输入变化
  const handleInputChange = (field, value) => {
    if (field === 'bankCardNo') {
      // 格式化银行卡号
      const formatted = formatBankCardNo(value);
      setFormData(prev => ({
        ...prev,
        [field]: formatted
      }));
    } else if (field === 'idCard') {
      // 身份证号转换为大写
      setFormData(prev => ({
        ...prev,
        [field]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}/bank-card-verify` : '';

  return (
    <>
      <Helmet>
        <title>{t('bankCardVerify.seo.title')}</title>
        <meta name="description" content={t('bankCardVerify.seo.description')} />
        <meta name="keywords" content={t('bankCardVerify.seo.keywords')} />
        <meta property="og:title" content={t('bankCardVerify.seo.title')} />
        <meta property="og:description" content={t('bankCardVerify.seo.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content="CUTool" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('bankCardVerify.seo.title')} />
        <meta name="twitter:description" content={t('bankCardVerify.seo.description')} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": t('bankCardVerify.title'),
            "description": t('bankCardVerify.seo.description'),
            "url": currentUrl,
            "provider": {
              "@type": "Organization",
              "name": "CUTool",
              "url": typeof window !== 'undefined' ? window.location.origin : ''
            },
            "serviceType": "Bank Card Verification",
            "areaServed": "CN",
            "offers": {
              "@type": "Offer",
              "price": "19.9",
              "priceCurrency": "CNY"
            }
          })}
        </script>
      </Helmet>
      <div className="bank-card-verify-container">
        {/* 内容区 */}
        <div className="bank-card-verify-content">
          {/* 类型说明 */}
          <div className="type-description-box">
            <div className="type-description-icon">ℹ️</div>
            <div className="type-description-text">
              {t('bankCardVerify.description')}
            </div>
          </div>

          {/* 表单 */}
          <div className="verify-form">
            <div className="form-group">
              <label>
                {t('bankCardVerify.form.bankCardNo')}
                <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formData.bankCardNo}
                onChange={(e) => handleInputChange('bankCardNo', e.target.value)}
                placeholder={t('bankCardVerify.form.bankCardNoPlaceholder')}
                maxLength={23} // 19位数字 + 4个空格
                className={!formData.bankCardNo ? 'required-field' : ''}
              />
              <div className="field-description">
                {t('bankCardVerify.form.bankCardNoHint')}
              </div>
            </div>

            <div className="form-group">
              <label>
                {t('bankCardVerify.form.name')}
                <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('bankCardVerify.form.namePlaceholder')}
                maxLength={20}
                className={!formData.name ? 'required-field' : ''}
              />
              <div className="field-description">
                {t('bankCardVerify.form.nameHint')}
              </div>
            </div>

            <div className="form-group">
              <label>
                {t('bankCardVerify.form.idCard')}
                <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                value={formData.idCard}
                onChange={(e) => handleInputChange('idCard', e.target.value)}
                placeholder={t('bankCardVerify.form.idCardPlaceholder')}
                maxLength={18}
                className={!formData.idCard ? 'required-field' : ''}
              />
              <div className="field-description">
                {t('bankCardVerify.form.idCardHint')}
              </div>
            </div>

            {/* 价格显示 */}
            {price !== null && (
              <div className="price-display">
                <span className="price-label">{t('bankCardVerify.price.label')}:</span>
                {priceLoading ? (
                  <span className="price-loading">{t('bankCardVerify.price.loading')}</span>
                ) : (
                  <span className="price-value">¥{price.toFixed(2)}</span>
                )}
              </div>
            )}

            {/* 表单操作按钮 */}
            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading || paymentStatus === 'pending'}
              >
                {loading ? t('bankCardVerify.form.verifying') : t('bankCardVerify.form.verifyButton')}
              </button>
              <button
                className="btn-secondary"
                onClick={handleReset}
                disabled={loading || paymentStatus === 'pending'}
              >
                {t('bankCardVerify.form.resetButton')}
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
              <p>{t('bankCardVerify.payment.waiting')}</p>
            </div>
          )}

          {/* 结果展示 */}
          {result && (
            <div className="verify-result">
              <h2>{t('bankCardVerify.result.title')}</h2>
              {result.bizCode && (
                <div className="result-status">
                  {result.bizCode === '1' && (
                    <div className="status-success">
                      {t('bankCardVerify.result.consistent')}
                    </div>
                  )}
                  {result.bizCode === '2' && (
                    <div className="status-error">
                      {t('bankCardVerify.result.inconsistent')}
                    </div>
                  )}
                  {result.bizCode === '3' && (
                    <div className="status-warning">
                      {t('bankCardVerify.result.noRecord')}
                    </div>
                  )}
                </div>
              )}
              {result.result && (
                <div className="bank-card-info">
                  <h3>{t('bankCardVerify.result.detail')}</h3>
                  <pre>{JSON.stringify(result.result, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BankCardVerify;

