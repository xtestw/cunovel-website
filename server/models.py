from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, JSON, UniqueConstraint, Index, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class AIDaily(Base):
    """AI日报模型"""
    __tablename__ = 'ai_daily'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='日报ID')
    date = Column(Date, nullable=False, comment='日期')
    language = Column(String(10), nullable=False, default='zh', comment='语言代码：zh-中文，en-英文')
    summary = Column(Text, comment='日报概要')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关联关系
    news = relationship('AINews', back_populates='daily', cascade='all, delete-orphan', order_by='AINews.order_index')

class AINews(Base):
    """AI新闻模型"""
    __tablename__ = 'ai_news'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='新闻ID')
    daily_id = Column(Integer, ForeignKey('ai_daily.id', ondelete='CASCADE'), nullable=False, comment='所属日报ID')
    language = Column(String(10), nullable=False, default='zh', comment='语言代码：zh-中文，en-英文')
    title = Column(String(255), nullable=False, comment='新闻标题')
    summary = Column(Text, comment='新闻摘要')
    content = Column(Text, comment='新闻详细内容（HTML格式）')
    source = Column(String(255), comment='新闻来源')
    source_link = Column(String(500), comment='来源链接')
    link = Column(String(500), comment='原文链接')
    tags = Column(JSON, comment='标签（JSON数组）')
    order_index = Column(Integer, default=0, comment='排序索引')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 关联关系
    daily = relationship('AIDaily', back_populates='news')

class AITutorial(Base):
    """AI教程模型"""
    __tablename__ = 'ai_tutorial'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='教程ID')
    category = Column(String(100), nullable=False, comment='教程分类')
    language = Column(String(10), nullable=False, default='zh', comment='语言代码：zh-中文，en-英文')
    title = Column(String(255), nullable=False, comment='教程标题')
    description = Column(Text, comment='教程描述')
    content = Column(Text, comment='教程详细内容（HTML格式）')
    link = Column(String(500), comment='外部链接')
    tags = Column(JSON, comment='标签（JSON数组）')
    order_index = Column(Integer, default=0, comment='排序索引')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')

class User(Base):
    """用户模型"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='用户ID')
    username = Column(String(100), unique=True, nullable=True, comment='用户名')
    email = Column(String(255), nullable=True, comment='邮箱')
    avatar_url = Column(String(500), nullable=True, comment='头像URL')
    provider = Column(String(50), nullable=False, comment='登录提供商：wechat, gmail, github')
    provider_user_id = Column(String(255), nullable=False, comment='第三方用户ID')
    display_name = Column(String(255), nullable=True, comment='显示名称')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    last_login_at = Column(DateTime, nullable=True, comment='最后登录时间')
    
    # 唯一约束：同一提供商下的用户ID唯一
    __table_args__ = (
        UniqueConstraint('provider', 'provider_user_id', name='uq_provider_user'),
        Index('idx_provider_user', 'provider', 'provider_user_id'),
    )

class Order(Base):
    """订单模型 - 存储支付宝订单信息"""
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment='订单ID')
    order_id = Column(String(64), unique=True, nullable=False, comment='订单号（out_trade_no）')
    trade_no = Column(String(64), nullable=True, comment='支付宝交易号（trade_no）')
    verify_type = Column(String(50), nullable=False, comment='核验类型：consistency, basicInfo, insuranceLog')
    form_data = Column(JSON, nullable=False, comment='查询的具体内容（JSON格式）')
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True, comment='用户ID（可选）')
    client_ip = Column(String(45), nullable=True, comment='订单发起的IP地址')
    amount = Column(Numeric(10, 2), nullable=False, comment='订单金额')
    status = Column(String(20), nullable=False, default='pending', comment='订单状态：pending, paid, failed, cancelled')
    trade_status = Column(String(20), nullable=True, comment='支付宝交易状态：WAIT_BUYER_PAY, TRADE_SUCCESS, TRADE_FINISHED等')
    subject = Column(String(255), nullable=False, comment='订单标题')
    result_data = Column(JSON, nullable=True, comment='查询结果（JSON格式）')
    verified_at = Column(DateTime, nullable=True, comment='查询完成时间')
    created_at = Column(DateTime, default=datetime.now, comment='创建时间')
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    paid_at = Column(DateTime, nullable=True, comment='支付时间')
    
    # 关联关系
    user = relationship('User', backref='orders')
    
    # 索引
    __table_args__ = (
        Index('idx_order_id', 'order_id'),
        Index('idx_trade_no', 'trade_no'),
        Index('idx_user_id', 'user_id'),
        Index('idx_status', 'status'),
        Index('idx_created_at', 'created_at'),
    )

