import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import './VehicleVerifyOrders.css';

const VehicleVerifyOrders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    try {
      const storedOrders = localStorage.getItem('vehicleVerifyOrders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        setOrders(parsedOrders);
      }
    } catch (err) {
      console.error('加载订单失败:', err);
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'consistency':
        return t('vehicleVerify.verifyType.consistency');
      case 'basicInfo':
        return t('vehicleVerify.verifyType.basicInfo');
      case 'insuranceLog':
        return t('vehicleVerify.verifyType.insuranceLog');
      default:
        return type;
    }
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
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };

  return (
    <>
      <Helmet>
        <title>{t('vehicleVerify.orders.title')} - CUTool</title>
      </Helmet>
      <div className="vehicle-verify-orders-container">
        <div className="vehicle-verify-orders-content">
          <h1>{t('vehicleVerify.orders.title')}</h1>

          {orders.length === 0 ? (
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
                    <tr key={index}>
                      <td>{order.orderId}</td>
                      <td>{getTypeLabel(order.type)}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>¥{order.amount?.toFixed(2) || '0.00'}</td>
                      <td>{formatDate(order.createTime)}</td>
                      <td>{formatDate(order.payTime)}</td>
                      <td>
                        <button
                          className="btn-view-detail"
                          onClick={() => handleViewDetail(order)}
                        >
                          {t('vehicleVerify.orders.viewDetail')}
                        </button>
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
                    <span>{getTypeLabel(selectedOrder.type)}</span>
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
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.createTime')}:</label>
                    <span>{formatDate(selectedOrder.createTime)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('vehicleVerify.orders.payTime')}:</label>
                    <span>{formatDate(selectedOrder.payTime)}</span>
                  </div>
                  <div className="detail-item">
                    <label>查询数据:</label>
                    <pre>{JSON.stringify(selectedOrder.data, null, 2)}</pre>
                  </div>
                  {selectedOrder.result && (
                    <div className="detail-item">
                      <label>查询结果:</label>
                      <pre>{JSON.stringify(selectedOrder.result, null, 2)}</pre>
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

