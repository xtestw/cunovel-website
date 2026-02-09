import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useSearchParams, NavLink } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './UserCredits.css';

/**
 * 我的积分页面：展示当前积分余额，入口跳转到独立充值页
 */
const UserCredits = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('auth_token');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const recharged = searchParams.get('recharged');
    const orderId = searchParams.get('orderId');
    if (recharged === '1' || orderId) {
      setRechargeSuccess(true);
      window.dispatchEvent(new CustomEvent('userCreditsUpdated'));
      const token = localStorage.getItem('auth_token');
      if (token) {
        fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.ok && r.json())
          .then((data) => data && setUser(data));
      }
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="user-credits-page">
        <div className="user-credits-card">
          <p className="user-credits-loading">{t('credits.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-credits-page">
        <Helmet>
          <title>{t('credits.pageTitle')} - CUTool</title>
        </Helmet>
        <div className="user-credits-card">
          <h1>{t('credits.pageTitle')}</h1>
          <p className="user-credits-login-hint">{t('credits.loginHint')}</p>
          <NavLink to="/" className="user-credits-btn primary">
            {t('credits.goLogin')}
          </NavLink>
        </div>
      </div>
    );
  }

  const credits = user.credits != null ? user.credits : 0;
  const rmbEquivalent = (credits * 0.1).toFixed(2);

  return (
    <div className="user-credits-page">
      <Helmet>
        <title>{t('credits.pageTitle')} - CUTool</title>
      </Helmet>
      <div className="user-credits-card">
        <h1>{t('credits.pageTitle')}</h1>
        <p className="user-credits-rule">{t('credits.rule')}</p>

        <div className="user-credits-balance">
          <span className="user-credits-balance-label">{t('credits.currentCredits')}</span>
          <span className="user-credits-balance-value">{credits}</span>
          <span className="user-credits-balance-rmb">{t('credits.approxRmb')} ¥{rmbEquivalent}</span>
        </div>

        {rechargeSuccess && (
          <div className="user-credits-success">{t('credits.rechargeSuccess')}</div>
        )}

        <div className="user-credits-actions">
          <NavLink to="/user/credits/recharge" className="user-credits-btn primary">
            {t('credits.goRecharge')}
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default UserCredits;
