import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './VerifyResult.css';

const VerifyResult = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get('orderId');
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      setError(errorParam === 'server_error' ? '服务器错误，请稍后重试' : 
               errorParam === 'unknown_error' ? '未知错误' : 
               errorParam === 'missing_order_id' ? '缺少订单号' :
               errorParam === 'order_not_found' ? '订单不存在' : '加载失败');
      setLoading(false);
      return;
    }
    
    if (orderId) {
      loadOrderDetail(orderId);
    } else {
      setError('缺少订单号');
      setLoading(false);
    }
  }, [location.search]);

  // 检查用户是否已登录
  const isUserLoggedIn = () => {
    return !!localStorage.getItem('auth_token');
  };

  // 获取认证头
  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // 加载订单详情
  const loadOrderDetail = async (orderId, retryCount = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/order/${orderId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('无权访问此订单');
        } else if (response.status === 404) {
          throw new Error('订单不存在');
        } else {
          throw new Error('获取订单详情失败');
        }
      }
      
      const orderData = await response.json();
      setOrder(orderData);
      
      // 如果订单已支付但还没有查询结果，且订单有表单数据，等待查询完成
      if (orderData.status === 'paid' && !orderData.resultData && orderData.formData && Object.keys(orderData.formData).length > 0) {
        // 最多等待30秒（15次，每次2秒）
        if (retryCount < 15) {
          setTimeout(() => {
            loadOrderDetail(orderId, retryCount + 1);
          }, 2000);
        } else {
          // 超过最大重试次数，显示等待提示
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('加载订单详情失败:', err);
      setError(err.message || '加载订单详情失败');
      setLoading(false);
    }
  };

  // 获取核验类型标签
  const getTypeLabel = (type) => {
    switch (type) {
      case 'consistency':
        return t('vehicleVerify.verifyType.consistency');
      case 'basicInfo':
        return t('vehicleVerify.verifyType.basicInfo');
      case 'insuranceLog':
        return t('vehicleVerify.verifyType.insuranceLog');
      case 'mobile2Meta':
        return '手机号二要素核验';
      case 'mobile3Meta':
        return '手机号三要素核验';
      case 'mobileOnlineTime':
        return '手机号在网状态查询';
      case 'bankCardVerify':
        return '银行卡核验';
      default:
        return type || '-';
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch (err) {
      return '-';
    }
  };

  // 渲染车辆核验结果
  const renderVehicleResult = (resultData) => {
    if (!resultData) return null;

    return (
      <div className="result-content">
        {/* 一致性核验结果 */}
        {resultData.bizCode && (
          <div className="result-status-section">
            <h3>核验状态</h3>
            <div className="result-status">
              {resultData.bizCode === '1' && (
                <div className="status-success">
                  <span className="status-icon">✓</span>
                  <span className="status-text">{t('vehicleVerify.result.consistent')}</span>
                </div>
              )}
              {resultData.bizCode === '2' && (
                <div className="status-error">
                  <span className="status-icon">✗</span>
                  <span className="status-text">{t('vehicleVerify.result.inconsistent')}</span>
                </div>
              )}
              {resultData.bizCode === '3' && (
                <div className="status-warning">
                  <span className="status-icon">?</span>
                  <span className="status-text">{t('vehicleVerify.result.noRecord')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 车辆信息 */}
        {resultData.vehicleInfo && (
          <div className="result-detail-section">
            <h3>{t('vehicleVerify.result.vehicleInfo')}</h3>
            <div className="detail-card">
              {Object.entries(resultData.vehicleInfo).map(([key, value]) => (
                <div key={key} className="detail-row">
                  <span className="detail-label">{key}:</span>
                  <span className="detail-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 投保日志 */}
        {resultData.insuranceLog && (
          <div className="result-detail-section">
            <h3>{t('vehicleVerify.result.insuranceLog')}</h3>
            <div className="detail-card">
              <pre>{JSON.stringify(resultData.insuranceLog, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染手机核验结果
  const renderPhoneResult = (resultData) => {
    if (!resultData) return null;

    const verifyType = order?.verifyType;

    return (
      <div className="result-content">
        {/* 二要素/三要素核验结果 */}
        {(verifyType === 'mobile2Meta' || verifyType === 'mobile3Meta') && resultData.bizCode && (
          <div className="result-status-section">
            <h3>核验状态</h3>
            <div className="result-status">
              {resultData.bizCode === '1' && (
                <div className="status-success">
                  <span className="status-icon">✓</span>
                  <span className="status-text">{resultData.bizCodeDesc || '核验一致'}</span>
                </div>
              )}
              {resultData.bizCode === '2' && (
                <div className="status-error">
                  <span className="status-icon">✗</span>
                  <span className="status-text">{resultData.bizCodeDesc || '核验不一致'}</span>
                </div>
              )}
              {resultData.bizCode === '3' && (
                <div className="status-warning">
                  <span className="status-icon">?</span>
                  <span className="status-text">{resultData.bizCodeDesc || '查无记录'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 在网状态查询结果 */}
        {verifyType === 'mobileOnlineTime' && (
          <div className="result-status-section">
            <h3>在网状态</h3>
            <div className="result-status">
              {resultData.onlineStatus === '1' && (
                <div className="status-success">
                  <span className="status-icon">✓</span>
                  <span className="status-text">在网</span>
                </div>
              )}
              {resultData.onlineStatus === '2' && (
                <div className="status-error">
                  <span className="status-icon">✗</span>
                  <span className="status-text">不在网</span>
                </div>
              )}
              {resultData.onlineStatus !== '1' && resultData.onlineStatus !== '2' && (
                <div className="status-warning">
                  <span className="status-icon">?</span>
                  <span className="status-text">未知</span>
                </div>
              )}
            </div>
            {resultData.onlineTime && (
              <div className="result-info">
                <span className="info-label">在网时长:</span>
                <span className="info-value">{resultData.onlineTime} 个月</span>
              </div>
            )}
            {resultData.carrier && (
              <div className="result-info">
                <span className="info-label">运营商:</span>
                <span className="info-value">{resultData.carrier}</span>
              </div>
            )}
          </div>
        )}

        {/* 核验信息 */}
        {(resultData.mobile || resultData.name || resultData.idCard) && (
          <div className="result-detail-section">
            <h3>核验信息</h3>
            <div className="detail-card">
              {resultData.mobile && (
                <div className="detail-row">
                  <span className="detail-label">手机号:</span>
                  <span className="detail-value">{resultData.mobile}</span>
                </div>
              )}
              {resultData.name && (
                <div className="detail-row">
                  <span className="detail-label">姓名:</span>
                  <span className="detail-value">{resultData.name}</span>
                </div>
              )}
              {resultData.idCard && (
                <div className="detail-row">
                  <span className="detail-label">身份证号:</span>
                  <span className="detail-value">{resultData.idCard}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 详细结果 */}
        {resultData.result && (
          <div className="result-detail-section">
            <h3>详细结果</h3>
            <div className="detail-card">
              <pre>{JSON.stringify(resultData.result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染银行卡核验结果
  const renderBankCardResult = (resultData) => {
    if (!resultData) return null;

    return (
      <div className="result-content">
        {/* 核验状态 */}
        {resultData.bizCode && (
          <div className="result-status-section">
            <h3>核验状态</h3>
            <div className="result-status">
              {resultData.bizCode === '1' && (
                <div className="status-success">
                  <span className="status-icon">✓</span>
                  <span className="status-text">核验一致</span>
                </div>
              )}
              {resultData.bizCode === '2' && (
                <div className="status-error">
                  <span className="status-icon">✗</span>
                  <span className="status-text">核验不一致</span>
                </div>
              )}
              {resultData.bizCode === '3' && (
                <div className="status-warning">
                  <span className="status-icon">?</span>
                  <span className="status-text">查无记录</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 银行卡信息 */}
        {resultData.result && (
          <div className="result-detail-section">
            <h3>银行卡信息</h3>
            <div className="detail-card">
              {typeof resultData.result === 'object' ? (
                Object.entries(resultData.result).map(([key, value]) => (
                  <div key={key} className="detail-row">
                    <span className="detail-label">{key}:</span>
                    <span className="detail-value">{String(value)}</span>
                  </div>
                ))
              ) : (
                <pre>{JSON.stringify(resultData.result, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 根据核验类型渲染结果
  const renderResult = () => {
    // 如果订单已支付但还没有查询结果，显示查询中状态
    if (order && order.status === 'paid' && !order.resultData) {
      // 检查是否有表单数据（如果有表单数据，说明应该会查询）
      if (order.formData && Object.keys(order.formData).length > 0) {
        return (
          <div className="no-result">
            <div className="loading-spinner-small"></div>
            <p>查询结果生成中，请稍候...</p>
            <p className="hint-text">如果长时间未显示结果，请点击刷新按钮</p>
            <button className="btn-refresh" onClick={() => {
              const urlParams = new URLSearchParams(location.search);
              const orderId = urlParams.get('orderId');
              if (orderId) {
                loadOrderDetail(orderId);
              }
            }}>
              刷新页面
            </button>
          </div>
        );
      } else {
        return (
          <div className="no-result">
            <p>订单已支付，但缺少查询数据，无法生成查询结果。</p>
            <button className="btn-refresh" onClick={() => {
              const urlParams = new URLSearchParams(location.search);
              const orderId = urlParams.get('orderId');
              if (orderId) {
                loadOrderDetail(orderId);
              }
            }}>
              刷新页面
            </button>
          </div>
        );
      }
    }
    
    if (!order || !order.resultData) {
      return (
        <div className="no-result">
          <p>暂无查询结果</p>
        </div>
      );
    }

    const verifyType = order.verifyType;
    
    if (verifyType === 'consistency' || verifyType === 'basicInfo' || verifyType === 'insuranceLog') {
      return renderVehicleResult(order.resultData);
    } else if (verifyType === 'mobile2Meta' || verifyType === 'mobile3Meta' || verifyType === 'mobileOnlineTime') {
      return renderPhoneResult(order.resultData);
    } else if (verifyType === 'bankCardVerify') {
      return renderBankCardResult(order.resultData);
    } else {
      return (
        <div className="result-content">
          <div className="result-detail-section">
            <h3>查询结果</h3>
            <div className="detail-card">
              <pre>{JSON.stringify(order.resultData, null, 2)}</pre>
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="verify-result-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-result-page">
        <div className="error-container">
          <div className="error-icon">✗</div>
          <h2>加载失败</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate(-1)}>
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="verify-result-page">
        <div className="error-container">
          <div className="error-icon">?</div>
          <h2>订单不存在</h2>
          <p>无法找到指定的订单</p>
          <button className="btn-back" onClick={() => navigate(-1)}>
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>查询结果 - {getTypeLabel(order.verifyType)} | CUTool</title>
      </Helmet>
      <div className="verify-result-page">
        <div className="verify-result-container">
          {/* 订单信息卡片 */}
          <div className="order-info-card">
            <div className="order-header">
              <h1>查询结果</h1>
              <button className="btn-close" onClick={() => navigate(-1)}>×</button>
            </div>
            <div className="order-info">
              <div className="info-row">
                <span className="info-label">订单号:</span>
                <span className="info-value">{order.orderId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">核验类型:</span>
                <span className="info-value">{getTypeLabel(order.verifyType)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">订单状态:</span>
                <span className={`status-badge status-${order.status}`}>
                  {order.status === 'paid' ? '已支付' : order.status === 'pending' ? '待支付' : order.status}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">订单金额:</span>
                <span className="info-value">¥{order.amount?.toFixed(2) || '0.00'}</span>
              </div>
              {order.paidAt && (
                <div className="info-row">
                  <span className="info-label">支付时间:</span>
                  <span className="info-value">{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.verifiedAt && (
                <div className="info-row">
                  <span className="info-label">查询时间:</span>
                  <span className="info-value">{formatDate(order.verifiedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 查询结果 */}
          <div className="result-container">
            {renderResult()}
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button className="btn-secondary" onClick={() => navigate(-1)}>
              返回
            </button>
            <button className="btn-primary" onClick={() => {
              const verifyType = order.verifyType;
              if (verifyType === 'consistency' || verifyType === 'basicInfo' || verifyType === 'insuranceLog') {
                navigate('/vehicle-verify/orders');
              } else if (verifyType === 'mobile2Meta' || verifyType === 'mobile3Meta' || verifyType === 'mobileOnlineTime') {
                navigate('/phone-verify/orders');
              } else if (verifyType === 'bankCardVerify') {
                navigate('/bank-card-verify/orders');
              } else {
                navigate(-1);
              }
            }}>
              查看订单列表
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyResult;

