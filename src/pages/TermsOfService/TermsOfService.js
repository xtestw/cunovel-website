import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import './TermsOfService.css';

const TermsOfService = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const content = isZh ? {
    title: '使用条款',
    lastUpdated: '最后更新：2024年12月',
    sections: [
      {
        title: '1. 接受条款',
        content: '通过访问和使用CuTool网站，您同意遵守本使用条款。如果您不同意这些条款，请不要使用我们的服务。'
      },
      {
        title: '2. 服务描述',
        content: 'CuTool提供免费的在线开发者工具，包括JSON格式化、代码格式化、时间戳转换、AI Token计算器等。我们保留随时修改、暂停或终止任何服务的权利。'
      },
      {
        title: '3. 用户行为',
        content: '您同意不会使用我们的服务进行任何非法活动、传播恶意软件、干扰服务运行或侵犯他人权利。禁止滥用我们的服务，包括但不限于自动化脚本、爬虫等可能影响服务性能的行为。'
      },
      {
        title: '4. 知识产权',
        content: 'CuTool网站的所有内容，包括但不限于文本、图形、徽标、图标、图像、软件，均受版权、商标和其他知识产权法保护。未经授权，不得复制、修改、分发或使用。'
      },
      {
        title: '5. 免责声明',
        content: 'CuTool按"现状"提供服务，不提供任何明示或暗示的保证。我们不保证服务的准确性、完整性、及时性或适用性。使用本服务的风险由您自行承担。'
      },
      {
        title: '6. 责任限制',
        content: '在法律允许的最大范围内，CuTool不对任何直接、间接、偶然、特殊或后果性损害承担责任，包括但不限于利润损失、数据丢失或业务中断。'
      },
      {
        title: '7. 第三方链接',
        content: '我们的网站可能包含指向第三方网站的链接。我们不对这些网站的内容或隐私做法负责。访问这些链接的风险由您自行承担。'
      },
      {
        title: '8. 服务变更',
        content: '我们保留随时修改、暂停或终止服务的权利，无需事先通知。我们不对任何服务中断或终止承担责任。'
      },
      {
        title: '9. 适用法律',
        content: '本使用条款受中华人民共和国法律管辖。任何争议应通过友好协商解决，协商不成的，提交有管辖权的人民法院解决。'
      },
      {
        title: '10. 联系我们',
        content: '如果您对本使用条款有任何疑问，请通过以下方式联系我们：邮箱：xuwei8091@gmail.com'
      }
    ]
  } : {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: December 2024',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content: 'By accessing and using the CuTool website, you agree to comply with these Terms of Service. If you do not agree to these terms, please do not use our services.'
      },
      {
        title: '2. Service Description',
        content: 'CuTool provides free online developer tools, including JSON formatting, code formatting, timestamp conversion, AI Token calculator, etc. We reserve the right to modify, suspend, or terminate any service at any time.'
      },
      {
        title: '3. User Conduct',
        content: 'You agree not to use our services for any illegal activities, spread malware, interfere with service operation, or infringe on others\' rights. Abuse of our services is prohibited, including but not limited to automated scripts, crawlers, and other behaviors that may affect service performance.'
      },
      {
        title: '4. Intellectual Property',
        content: 'All content on the CuTool website, including but not limited to text, graphics, logos, icons, images, and software, is protected by copyright, trademark, and other intellectual property laws. Unauthorized copying, modification, distribution, or use is prohibited.'
      },
      {
        title: '5. Disclaimer',
        content: 'CuTool provides services "as is" without any express or implied warranties. We do not guarantee the accuracy, completeness, timeliness, or suitability of the services. You use this service at your own risk.'
      },
      {
        title: '6. Limitation of Liability',
        content: 'To the maximum extent permitted by law, CuTool shall not be liable for any direct, indirect, incidental, special, or consequential damages, including but not limited to loss of profits, data loss, or business interruption.'
      },
      {
        title: '7. Third-Party Links',
        content: 'Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these websites. You access these links at your own risk.'
      },
      {
        title: '8. Service Changes',
        content: 'We reserve the right to modify, suspend, or terminate services at any time without prior notice. We are not responsible for any service interruption or termination.'
      },
      {
        title: '9. Governing Law',
        content: 'These Terms of Service are governed by the laws of the People\'s Republic of China. Any disputes shall be resolved through friendly negotiation, and if negotiation fails, submitted to the competent people\'s court for resolution.'
      },
      {
        title: '10. Contact Us',
        content: 'If you have any questions about these Terms of Service, please contact us at: Email: xuwei8091@gmail.com'
      }
    ]
  };

  return (
    <div className="terms-of-service-container">
      <Helmet>
        <title>{content.title} - CuTool</title>
        <meta name="description" content={isZh ? 'CuTool使用条款，说明使用我们服务的规则和条件。' : 'CuTool Terms of Service, explaining the rules and conditions for using our services.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://cutool.online/terms-of-service`} />
      </Helmet>
      
      <div className="terms-of-service-content">
        <h1>{content.title}</h1>
        <p className="last-updated">{content.lastUpdated}</p>
        
        <div className="terms-sections">
          {content.sections.map((section, index) => (
            <div key={index} className="terms-section">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

