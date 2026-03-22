'use client';

import React from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from '@vercel/speed-insights/react';
import i18n from '@/i18n';
import StyledComponentsRegistry from '@/lib/styled-registry';

function I18nRemount({ children }) {
  const { i18n: i18nInstance } = useTranslation();
  return <React.Fragment key={i18nInstance.language}>{children}</React.Fragment>;
}

export default function Providers({ children }) {
  return (
    <StyledComponentsRegistry>
      <I18nextProvider i18n={i18n}>
        <I18nRemount>
          <HelmetProvider>
            {children}
            <SpeedInsights />
          </HelmetProvider>
        </I18nRemount>
      </I18nextProvider>
    </StyledComponentsRegistry>
  );
}
