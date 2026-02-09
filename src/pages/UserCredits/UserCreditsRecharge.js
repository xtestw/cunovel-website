import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './UserCredits.css';

const PRESET_AMOUNTS = [10, 50, 100, 200, 500];

/**
 * 积分充值独立页面：选择金额、支付宝支付
 */
const UserCreditsRecharge = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleRecharge = async (amountRmb) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError(t('credits.pleaseLoginFirst'));
      return;
    }
    setRechargeLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/credits/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: amountRmb })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || t('credits.rechargeFail'));
        setRechargeLoading(false);
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError(t('credits.noPaymentUrl'));
    } catch (err) {
      setError(err.message || t('credits.networkError'));
    }
    setRechargeLoading(false);
  };

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
          <title>{t('credits.pageTitleRecharge')} - CUTool</title>
        </Helmet>
        <div className="user-credits-card">
          <h1>{t('credits.pageTitleRecharge')}</h1>
          <p className="user-credits-login-hint">{t('credits.loginHint')}</p>
          <NavLink to="/" className="user-credits-btn primary">
            {t('credits.goLogin')}
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="user-credits-page">
      <Helmet>
        <title>{t('credits.pageTitleRecharge')} - CUTool</title>
      </Helmet>
      <div className="user-credits-card user-credits-card-recharge">
        <nav className="user-credits-breadcrumb">
          <NavLink to="/user/credits" className="user-credits-back">
            ← {t('credits.backToCredits')}
          </NavLink>
        </nav>

        <h1>{t('credits.pageTitleRecharge')}</h1>
        <p className="user-credits-rule">{t('credits.rule')}</p>

        <h2 className="user-credits-section-title">{t('credits.rechargeTitle')}</h2>
        <p className="user-credits-section-desc">{t('credits.rechargeDesc')}</p>

        {error && <div className="user-credits-error">{error}</div>}

        <div className="user-credits-amounts">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              className="user-credits-amount-btn"
              onClick={() => handleRecharge(amount)}
              disabled={rechargeLoading}
            >
              <span className="user-credits-amount-rmb">¥{amount}</span>
              <span className="user-credits-amount-credits">
                = {amount * 10} {t('credits.amountCredits')}
              </span>
            </button>
          ))}
        </div>

        {rechargeLoading && (
          <p className="user-credits-loading-inline">{t('credits.rechargeRedirecting')}</p>
        )}
      </div>
    </div>
  );
};

export default UserCreditsRecharge;
