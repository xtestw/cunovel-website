import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const content = isZh ? {
    title: '隐私政策',
    lastUpdated: '最后更新：2024年12月',
    sections: [
      {
        title: '1. 信息收集',
        content: 'CuTool致力于保护您的隐私。我们收集的信息包括：您使用我们服务时提供的信息、自动收集的技术信息（如IP地址、浏览器类型、访问时间等）。我们不会收集您的个人敏感信息，除非您明确同意。'
      },
      {
        title: '2. 信息使用',
        content: '我们使用收集的信息来：提供和改进我们的服务、分析使用情况、防止欺诈和滥用、遵守法律义务。我们不会将您的个人信息出售给第三方。'
      },
      {
        title: '3. Cookie和跟踪技术',
        content: '我们使用Cookie和类似技术来改善用户体验、分析网站流量、提供个性化内容。您可以通过浏览器设置管理Cookie偏好。'
      },
      {
        title: '4. 第三方服务',
        content: '我们使用Google AdSense等第三方服务来展示广告和分析网站使用情况。这些服务可能会使用Cookie和跟踪技术。我们建议您查看这些服务的隐私政策。'
      },
      {
        title: '5. 数据安全',
        content: '我们采取合理的安全措施来保护您的信息，包括加密传输、访问控制等。但请注意，互联网传输并非100%安全。'
      },
      {
        title: '6. 您的权利',
        content: '您有权访问、更正、删除您的个人信息。如果您对我们的隐私政策有任何疑问，请通过反馈邮箱联系我们。'
      },
      {
        title: '7. 儿童隐私',
        content: '我们的服务不面向13岁以下的儿童。我们不会故意收集儿童的个人信息。'
      },
      {
        title: '8. 政策变更',
        content: '我们可能会不时更新本隐私政策。重大变更将在网站上发布通知。继续使用我们的服务即表示您接受更新后的政策。'
      },
      {
        title: '9. 联系我们',
        content: '如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：邮箱：xuwei8091@gmail.com'
      }
    ]
  } : {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: December 2024',
    sections: [
      {
        title: '1. Information Collection',
        content: 'CuTool is committed to protecting your privacy. The information we collect includes: information you provide when using our services, and technical information automatically collected (such as IP address, browser type, access time, etc.). We do not collect your sensitive personal information unless you explicitly consent.'
      },
      {
        title: '2. Information Use',
        content: 'We use the collected information to: provide and improve our services, analyze usage, prevent fraud and abuse, and comply with legal obligations. We do not sell your personal information to third parties.'
      },
      {
        title: '3. Cookies and Tracking Technologies',
        content: 'We use cookies and similar technologies to improve user experience, analyze website traffic, and provide personalized content. You can manage cookie preferences through your browser settings.'
      },
      {
        title: '4. Third-Party Services',
        content: 'We use third-party services such as Google AdSense to display ads and analyze website usage. These services may use cookies and tracking technologies. We recommend that you review the privacy policies of these services.'
      },
      {
        title: '5. Data Security',
        content: 'We take reasonable security measures to protect your information, including encrypted transmission, access control, etc. However, please note that internet transmission is not 100% secure.'
      },
      {
        title: '6. Your Rights',
        content: 'You have the right to access, correct, and delete your personal information. If you have any questions about our privacy policy, please contact us via the feedback email.'
      },
      {
        title: '7. Children\'s Privacy',
        content: 'Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children.'
      },
      {
        title: '8. Policy Changes',
        content: 'We may update this privacy policy from time to time. Significant changes will be notified on the website. Continued use of our services indicates your acceptance of the updated policy.'
      },
      {
        title: '9. Contact Us',
        content: 'If you have any questions or suggestions about this privacy policy, please contact us at: Email: xuwei8091@gmail.com'
      }
    ]
  };

  return (
    <div className="privacy-policy-container">
      <Helmet>
        <title>{content.title} - CuTool</title>
        <meta name="description" content={isZh ? 'CuTool隐私政策，说明我们如何收集、使用和保护您的个人信息。' : 'CuTool Privacy Policy, explaining how we collect, use, and protect your personal information.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://cutool.online/privacy-policy`} />
      </Helmet>
      
      <div className="privacy-policy-content">
        <h1>{content.title}</h1>
        <p className="last-updated">{content.lastUpdated}</p>
        
        <div className="policy-sections">
          {content.sections.map((section, index) => (
            <div key={index} className="policy-section">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

