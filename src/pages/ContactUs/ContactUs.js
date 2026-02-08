import React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import './ContactUs.css';

const ContactUs = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  const content = isZh ? {
    title: '联系我们',
    subtitle: '我们很乐意听到您的声音',
    description: '如果您有任何问题、建议、反馈或合作意向，请通过以下方式联系我们。我们会尽快回复您。',
    methods: [
      {
        title: '邮箱联系',
        description: '发送邮件至我们的邮箱，我们会在24小时内回复',
        value: 'xuwei8091@gmail.com',
        type: 'email',
        link: 'mailto:xuwei8091@gmail.com'
      },
      {
        title: '网站',
        description: '访问我们的官方网站了解更多信息',
        value: 'https://cutool.online',
        type: 'website',
        link: 'https://cutool.online'
      }
    ],
    feedback: {
      title: '反馈类型',
      options: [
        '功能建议',
        '问题报告',
        '内容反馈',
        '合作咨询',
        '其他'
      ]
    },
    response: '我们通常在24小时内回复所有邮件。对于紧急问题，我们会优先处理。'
  } : {
    title: 'Contact Us',
    subtitle: 'We\'d love to hear from you',
    description: 'If you have any questions, suggestions, feedback, or partnership inquiries, please contact us through the following methods. We will reply to you as soon as possible.',
    methods: [
      {
        title: 'Email',
        description: 'Send an email to our mailbox, we will reply within 24 hours',
        value: 'xuwei8091@gmail.com',
        type: 'email',
        link: 'mailto:xuwei8091@gmail.com'
      },
      {
        title: 'Website',
        description: 'Visit our official website to learn more',
        value: 'https://cutool.online',
        type: 'website',
        link: 'https://cutool.online'
      }
    ],
    feedback: {
      title: 'Feedback Types',
      options: [
        'Feature Suggestions',
        'Bug Reports',
        'Content Feedback',
        'Partnership Inquiries',
        'Others'
      ]
    },
    response: 'We usually reply to all emails within 24 hours. For urgent issues, we will prioritize them.'
  };

  return (
    <div className="contact-us-container">
      <Helmet>
        <title>{content.title} - CuTool</title>
        <meta name="description" content={isZh ? '联系CuTool - 我们很乐意听到您的问题、建议和反馈。' : 'Contact CuTool - We\'d love to hear your questions, suggestions, and feedback.'} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://cutool.online/contact-us`} />
      </Helmet>
      
      <div className="contact-us-content">
        <h1>{content.title}</h1>
        <p className="subtitle">{content.subtitle}</p>
        <p className="description">{content.description}</p>
        
        <div className="contact-methods">
          {content.methods.map((method, index) => (
            <div key={index} className="contact-method">
              <h2>{method.title}</h2>
              <p className="method-description">{method.description}</p>
              <div className="method-value">
                {method.type === 'email' ? (
                  <a href={method.link} className="contact-link">
                    {method.value}
                  </a>
                ) : (
                  <a href={method.link} target="_blank" rel="noopener noreferrer" className="contact-link">
                    {method.value}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="feedback-section">
          <h2>{content.feedback.title}</h2>
          <ul className="feedback-options">
            {content.feedback.options.map((option, index) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
        </div>
        
        <div className="response-info">
          <p>{content.response}</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

