from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, JSON
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

