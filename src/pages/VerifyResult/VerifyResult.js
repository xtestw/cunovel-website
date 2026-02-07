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

  // 轮询订单结果（当订单已支付但还没有查询结果时）
  useEffect(() => {
    // 如果订单不存在、未支付、或已有结果，不需要轮询
    if (!order || order.status !== 'paid' || order.resultData) {
      return;
    }
    
    // 检查是否有表单数据（如果有表单数据，说明应该会查询）
    if (!order.formData || Object.keys(order.formData).length === 0) {
      return;
    }
    
    const orderId = order.orderId;
    if (!orderId) {
      return;
    }
    
    // 在useEffect内部定义getAuthHeaders，避免依赖项问题
    const getAuthHeadersForPolling = () => {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return headers;
    };
    
    let pollingCount = 0;
    const maxPollingCount = 60; // 最多轮询60次（2分钟）
    const pollingInterval = 2000; // 2秒
    
    const pollingTimer = setInterval(async () => {
      pollingCount++;
      try {
        const response = await fetch(`${API_BASE_URL}/vehicle-verify/order/${orderId}`, {
          headers: getAuthHeadersForPolling()
        });
        
        if (response.ok) {
          const orderData = await response.json();
          // 如果查询结果已生成，更新订单并停止轮询
          if (orderData.resultData) {
            setOrder(orderData);
            clearInterval(pollingTimer);
          } else if (pollingCount >= maxPollingCount) {
            // 超过最大轮询次数，停止轮询
            clearInterval(pollingTimer);
          }
        } else {
          // 如果请求失败，继续尝试直到达到最大次数
          if (pollingCount >= maxPollingCount) {
            clearInterval(pollingTimer);
          }
        }
      } catch (err) {
        console.error('轮询订单详情失败:', err);
        // 轮询失败不影响，继续尝试
        if (pollingCount >= maxPollingCount) {
          clearInterval(pollingTimer);
        }
      }
    }, pollingInterval);
    
    // 清理函数
    return () => {
      clearInterval(pollingTimer);
    };
  }, [order?.orderId, order?.status, order?.resultData]);

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

  // 加载订单详情（只加载一次，轮询由useEffect处理）
  const loadOrderDetail = async (orderId) => {
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
      setLoading(false);
      
      // 注意：轮询逻辑由useEffect处理，这里不需要递归调用
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

  // 获取参数标签（中文显示）
  const getParamLabel = (key) => {
    const labelMap = {
      'mobile': '手机号',
      'phone': '手机号',
      'name': '姓名',
      'idCard': '身份证号',
      'id_card': '身份证号',
      'bankCardNo': '银行卡号',
      'bank_card_no': '银行卡号',
      'plateNumber': '车牌号',
      'plate_number': '车牌号',
      'vehicleType': '车辆类型',
      'vehicle_type': '车辆类型',
      'vin': 'VIN码',
      'VIN': 'VIN码'
    };
    return labelMap[key] || key;
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
    // 如果订单已支付但还没有查询结果，显示查询中状态（轮询由useEffect处理）
    if (order && order.status === 'paid' && !order.resultData) {
      // 检查是否有表单数据（如果有表单数据，说明应该会查询）
      if (order.formData && Object.keys(order.formData).length > 0) {
        return (
          <div className="no-result">
            <div className="loading-spinner-small"></div>
            <p>查询结果生成中，请稍候...</p>
            <p className="hint-text">系统正在自动查询，请耐心等待</p>
            <button className="btn-refresh" onClick={() => {
              const urlParams = new URLSearchParams(location.search);
              const orderId = urlParams.get('orderId');
              if (orderId) {
                loadOrderDetail(orderId);
              }
            }}>
              手动刷新
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

          {/* 查询参数 */}
          {order.formData && Object.keys(order.formData).length > 0 && (
            <div className="query-params-card">
              <h2>查询参数</h2>
              <div className="query-params-content">
                {Object.entries(order.formData).map(([key, value]) => {
                  // 对敏感信息进行部分隐藏
                  let displayValue = value;
                  
                  // 处理null或undefined
                  if (value == null) {
                    displayValue = '-';
                  } else if (typeof value === 'string' && value.trim() === '') {
                    displayValue = '-';
                  } else if (typeof value === 'string' && value.length > 0) {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey.includes('card') || lowerKey.includes('bank')) {
                      // 银行卡号：只显示后4位
                      const cleanedValue = value.replace(/\s/g, ''); // 移除空格
                      if (cleanedValue.length > 4) {
                        displayValue = '****' + cleanedValue.slice(-4);
                      }
                    } else if (lowerKey.includes('idcard') || lowerKey.includes('id_card')) {
                      // 身份证号：只显示前3位和后4位
                      if (value.length > 7) {
                        displayValue = value.slice(0, 3) + '****' + value.slice(-4);
                      }
                    } else if (lowerKey.includes('mobile') || lowerKey.includes('phone')) {
                      // 手机号：只显示前3位和后4位
                      const cleanedValue = value.replace(/\s/g, ''); // 移除空格
                      if (cleanedValue.length > 7) {
                        displayValue = cleanedValue.slice(0, 3) + '****' + cleanedValue.slice(-4);
                      }
                    }
                  }
                  
                  return (
                    <div key={key} className="param-row">
                      <span className="param-label">{getParamLabel(key)}:</span>
                      <span className="param-value">{String(displayValue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

