import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './VehicleVerifyOrders.css';

const VehicleVerifyOrders = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  // 检查URL参数中是否有orderId，如果有则自动加载订单详情
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
      // 延迟加载，等待订单列表加载完成
      setTimeout(() => {
        handleViewDetailByOrderId(orderId);
      }, 500);
    }
  }, [location.search, orders]);

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

  // 从本地存储获取订单号列表
  const getLocalOrderIds = () => {
    try {
      const orderIds = JSON.parse(localStorage.getItem('vehicleVerifyOrderIds') || '[]');
      return Array.isArray(orderIds) ? orderIds : [];
    } catch (err) {
      console.error('读取本地订单号失败:', err);
      return [];
    }
  };

  // 加载订单列表
  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const isLoggedIn = isUserLoggedIn();
      const localOrderIds = getLocalOrderIds();
      
      let serverOrders = [];
      
      if (isLoggedIn) {
        // 用户已登录，获取服务器上的所有订单，同时传递本地订单号列表用于合并
        let url = `${API_BASE_URL}/vehicle-verify/orders?page=1&pageSize=100`;
        if (localOrderIds.length > 0) {
          const orderIdsParam = JSON.stringify(localOrderIds);
          url += `&orderIds=${encodeURIComponent(orderIdsParam)}`;
        }
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          serverOrders = data.data || [];
        } else {
          console.error('获取服务器订单失败:', response.statusText);
        }
      } else if (localOrderIds.length > 0) {
        // 用户未登录，但本地有订单号，通过订单号列表获取订单详情
        const orderIdsParam = JSON.stringify(localOrderIds);
        const response = await fetch(
          `${API_BASE_URL}/vehicle-verify/orders?orderIds=${encodeURIComponent(orderIdsParam)}`,
          {
            headers: getAuthHeaders()
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          serverOrders = data.data || [];
        } else {
          console.error('获取本地订单详情失败:', response.statusText);
        }
      }
      
      // 合并订单（去重，按创建时间降序排序）
      const orderMap = new Map();
      
      // 先添加服务器订单
      serverOrders.forEach(order => {
        orderMap.set(order.orderId, order);
      });
      
      // 如果本地有订单号但服务器没有返回，创建一个占位订单
      localOrderIds.forEach(orderId => {
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            orderId: orderId,
            status: 'pending',
            createdAt: null
          });
        }
      });
      
      // 转换为数组并按创建时间排序
      let mergedOrders = Array.from(orderMap.values()).sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // 降序
      });
      
      // 根据路径过滤订单类型
      const filterTypes = getFilterType();
      if (filterTypes) {
        mergedOrders = mergedOrders.filter(order => filterTypes.includes(order.verifyType));
      }
      
      setOrders(mergedOrders);
    } catch (err) {
      console.error('加载订单失败:', err);
      setError(err.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取订单详情
  const fetchOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle-verify/order/${orderId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('获取订单详情失败');
      }
      
      const orderDetail = await response.json();
      return orderDetail;
    } catch (err) {
      console.error('获取订单详情错误:', err);
      throw err;
    } finally {
      setLoadingDetail(false);
    }
  };

  // 根据订单ID查看订单详情
  const handleViewDetailByOrderId = async (orderId) => {
    try {
      const orderDetail = await fetchOrderDetail(orderId);
      setSelectedOrder(orderDetail);
      // 更新URL，移除orderId参数（可选，保持当前URL也可以）
      // navigate(location.pathname, { replace: true });
    } catch (err) {
      console.error('获取订单详情失败:', err);
      // 如果订单不存在或无权访问，尝试从订单列表中查找
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        setSelectedOrder(order);
      } else {
        alert('获取订单详情失败，请稍后重试');
      }
    }
  };

  // 查看订单详情
  const handleViewDetail = async (order) => {
    try {
      // 如果订单已经有完整信息（有 formData 和 resultData），直接显示
      if (order.formData && order.resultData !== undefined) {
        setSelectedOrder(order);
      } else {
        // 否则从接口获取完整详情
        const orderDetail = await fetchOrderDetail(order.orderId);
        setSelectedOrder(orderDetail);
        
        // 如果订单已支付但还没有查询结果，可以跳转到查询结果页面查看
        if (orderDetail.status === 'paid' && !orderDetail.resultData && orderDetail.formData) {
          // 可以选择跳转到查询结果页面，或者显示提示
          // 这里我们显示提示，让用户可以选择跳转
          if (window.confirm('订单已支付，查询结果生成中。是否跳转到查询结果页面？')) {
            navigate(`/verify-result?orderId=${order.orderId}`);
            return;
          }
        }
      }
    } catch (err) {
      console.error('获取订单详情失败:', err);
      // 如果获取失败，尝试使用已有信息显示
      if (order.formData) {
        setSelectedOrder(order);
      } else {
        alert('获取订单详情失败，请稍后重试');
      }
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };

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

  // 获取页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/phone-verify/orders')) {
      return '手机号核验订单';
    } else if (path.includes('/bank-card-verify/orders')) {
      return '银行卡核验订单';
    } else {
      return t('vehicleVerify.orders.title');
    }
  };

  // 根据当前路径确定要过滤的订单类型
  const getFilterType = () => {
    const path = location.pathname;
    if (path.includes('/phone-verify/orders')) {
      return ['mobile2Meta', 'mobile3Meta', 'mobileOnlineTime'];
    } else if (path.includes('/bank-card-verify/orders')) {
      return ['bankCardVerify'];
    } else if (path.includes('/vehicle-verify/orders')) {
      return ['consistency', 'basicInfo', 'insuranceLog'];
    }
    return null; // 不过滤，显示所有
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return t('vehicleVerify.orders.statusPending');
      case 'paid':
        return t('vehicleVerify.orders.statusPaid');
      case 'failed':
        return t('vehicleVerify.orders.statusFailed');
      case 'completed':
        return t('vehicleVerify.orders.statusCompleted');
      case 'cancelled':
        return '已取消';
      case 'timeout':
        return '超时';
      default:
        return status || '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch (err) {
      return '-';
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('vehicleVerify.orders.title')} - CUTool</title>
      </Helmet>
      <div className="vehicle-verify-orders-container">
        <div className="vehicle-verify-orders-content">
          <h1>{getPageTitle()}</h1>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : orders.length === 0 ? (
            <div className="no-orders">
              {t('vehicleVerify.orders.noOrders')}
            </div>
          ) : (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>{t('vehicleVerify.orders.orderId')}</th>
                    <th>{t('vehicleVerify.orders.type')}</th>
                    <th>{t('vehicleVerify.orders.status')}</th>
                    <th>{t('vehicleVerify.orders.amount')}</th>
                    <th>{t('vehicleVerify.orders.createTime')}</th>
                    <th>{t('vehicleVerify.orders.payTime')}</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <tr key={order.orderId || index}>
                      <td>{order.orderId}</td>
                      <td>{getTypeLabel(order.verifyType)}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>¥{order.amount?.toFixed(2) || '0.00'}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{formatDate(order.paidAt)}</td>
                      <td>
                        <div className="order-actions">
                          <button
                            className="btn-view-detail"
                            onClick={() => handleViewDetail(order)}
                            disabled={loadingDetail}
                          >
                            {loadingDetail ? '加载中...' : t('vehicleVerify.orders.viewDetail')}
                          </button>
                          {order.status === 'paid' && order.hasResult && (
                            <button
                              className="btn-view-result"
                              onClick={() => navigate(`/verify-result?orderId=${order.orderId}`)}
                            >
                              查看结果
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 订单详情弹窗 */}
          {selectedOrder && (
            <div className="order-detail-modal" onClick={handleCloseDetail}>
              <div className="order-detail-content" onClick={(e) => e.stopPropagation()}>
                <div className="order-detail-header">
                  <h2>{t('vehicleVerify.orders.orderId')}: {selectedOrder.orderId}</h2>
                  <button className="btn-close" onClick={handleCloseDetail}>×</button>
                </div>
                <div className="order-detail-body">
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.type')}:</label>
                    <span>{getTypeLabel(selectedOrder.verifyType)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.status')}:</label>
                    <span className={`status-badge status-${selectedOrder.status}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.amount')}:</label>
                    <span>¥{selectedOrder.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  {selectedOrder.tradeNo && (
                    <div className="detail-item">
                      <label>交易号:</label>
                      <span>{selectedOrder.tradeNo}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.createTime')}:</label>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.paidAt && (
                    <div className="detail-item">
                      <label>{t('vehicleVerify.orders.payTime')}:</label>
                      <span>{formatDate(selectedOrder.paidAt)}</span>
                    </div>
                  )}
                  {selectedOrder.formData && (
                    <div className="detail-item">
                      <label>查询数据:</label>
                      <pre>{JSON.stringify(selectedOrder.formData, null, 2)}</pre>
                    </div>
                  )}
                  {selectedOrder.resultData && (
                    <div className="detail-item">
                      <label>查询结果:</label>
                      <div className="result-data-display">
                        {selectedOrder.verifyType === 'consistency' && selectedOrder.resultData.bizCode && (
                          <div className="result-status">
                            {selectedOrder.resultData.bizCode === '1' && (
                              <div className="status-success">校验一致</div>
                            )}
                            {selectedOrder.resultData.bizCode === '2' && (
                              <div className="status-error">校验不一致</div>
                            )}
                            {selectedOrder.resultData.bizCode === '3' && (
                              <div className="status-warning">查无记录</div>
                            )}
                          </div>
                        )}
                        {selectedOrder.resultData.vehicleInfo && (
                          <div className="result-section">
                            <h4>车辆信息:</h4>
                            <pre>{JSON.stringify(selectedOrder.resultData.vehicleInfo, null, 2)}</pre>
                          </div>
                        )}
                        {selectedOrder.resultData.insuranceLog && (
                          <div className="result-section">
                            <h4>投保日志:</h4>
                            <pre>{JSON.stringify(selectedOrder.resultData.insuranceLog, null, 2)}</pre>
                          </div>
                        )}
                        {selectedOrder.resultData.result && (
                          <div className="result-section">
                            <h4>查询结果:</h4>
                            <pre>{JSON.stringify(selectedOrder.resultData.result, null, 2)}</pre>
                          </div>
                        )}
                        {!selectedOrder.resultData.vehicleInfo && !selectedOrder.resultData.insuranceLog && !selectedOrder.resultData.result && (
                          <pre>{JSON.stringify(selectedOrder.resultData, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedOrder.status === 'paid' && !selectedOrder.resultData && (
                    <div className="detail-item">
                      <label>查询结果:</label>
                      <span className="status-warning">查询中或查询失败，请稍后刷新</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VehicleVerifyOrders;
