from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, AIDaily, AINews, AITutorial
from config import Config
import os

app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 配置
app.config.from_object(Config)

# 创建数据库引擎和会话
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# 创建数据库表（如果不存在）
Base.metadata.create_all(engine)

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # 注意：这里不关闭session，让调用者负责关闭

# AI日报接口 - 获取今天的日报
@app.route('/api/ai-daily/today', methods=['GET'])
def get_today_daily():
    db = get_db()
    try:
        today = datetime.now().date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询今天的日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == today,
            AIDaily.language == language
        ).first()
        
        if not daily:
            # 如果没有今天的日报，返回空数据
            return jsonify({
                'date': today.strftime('%Y-%m-%d'),
                'summary': None,
                'news': []
            })
        
        # 根据语言参数决定查询哪些新闻
        # 中文模式：显示中文和英文所有新闻
        # 英文模式：只显示英文新闻
        if language == 'zh':
            # 查询中文和英文的新闻
            # 需要分别查询中文和英文的日报
            daily_en = db.query(AIDaily).filter(
                AIDaily.date == today,
                AIDaily.language == 'en'
            ).first()
            
            news_list = []
            # 先添加中文新闻
            news_zh = db.query(AINews).filter(
                AINews.daily_id == daily.id,
                AINews.language == 'zh'
            ).order_by(AINews.order_index).all()
            news_list.extend(news_zh)
            
            # 再添加英文新闻（如果存在英文日报）
            if daily_en:
                news_en = db.query(AINews).filter(
                    AINews.daily_id == daily_en.id,
                    AINews.language == 'en'
                ).order_by(AINews.order_index).all()
                news_list.extend(news_en)
        else:
            # 只查询英文新闻
            news_list = db.query(AINews).filter(
                AINews.daily_id == daily.id,
                AINews.language == 'en'
            ).order_by(AINews.order_index).all()
        
        # 构建返回数据
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'summary': daily.summary,
            'news': []
        }
        
        for news in news_list:
            result['news'].append({
                'id': news.id,
                'title': news.title,
                'summary': news.summary,
                'link': news.link
            })
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'Error fetching today daily: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 历史日报接口
@app.route('/api/ai-daily/history', methods=['GET'])
def get_history_dailies():
    db = get_db()
    try:
        today = datetime.now().date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询最近7天的历史日报
        history = []
        for i in range(1, 8):
            date = today - timedelta(days=i)
            daily = db.query(AIDaily).filter(
                AIDaily.date == date,
                AIDaily.language == language
            ).first()
            
            if daily:
                # 统计新闻数量（同语言）
                news_count = db.query(AINews).filter(
                    AINews.daily_id == daily.id,
                    AINews.language == language
                ).count()
                
                history.append({
                    'date': daily.date.strftime('%Y-%m-%d'),
                    'summary': daily.summary,
                    'news': [{'title': '...'} for _ in range(news_count)] if news_count > 0 else []
                })
        
        return jsonify(history)
    except Exception as e:
        app.logger.error(f'Error fetching history dailies: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 特定日期的日报接口
@app.route('/api/ai-daily/<date>', methods=['GET'])
def get_daily_by_date(date):
    db = get_db()
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询指定日期的日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == date_obj,
            AIDaily.language == language
        ).first()
        
        if not daily:
            return jsonify({'error': 'Daily not found'}), 404
        
        # 查询关联的新闻（同语言）
        news_list = db.query(AINews).filter(
            AINews.daily_id == daily.id,
            AINews.language == language
        ).order_by(AINews.order_index).all()
        
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'summary': daily.summary,
            'news': []
        }
        
        for news in news_list:
            result['news'].append({
                'id': news.id,
                'title': news.title,
                'summary': news.summary,
                'link': news.link
            })
        
        return jsonify(result)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        app.logger.error(f'Error fetching daily by date: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 新闻详情接口
@app.route('/api/ai-daily/<date>/news/<int:news_id>', methods=['GET'])
def get_news_detail(date, news_id):
    db = get_db()
    try:
        date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询日报
        daily = db.query(AIDaily).filter(
            AIDaily.date == date_obj,
            AIDaily.language == language
        ).first()
        
        if not daily:
            return jsonify({'error': 'Daily not found'}), 404
        
        # 查询该日报下的所有新闻（同语言），按排序索引排序
        news_list = db.query(AINews).filter(
            AINews.daily_id == daily.id,
            AINews.language == language
        ).order_by(AINews.order_index).all()
        
        # news_id 是数组索引，检查是否有效
        if news_id < 0 or news_id >= len(news_list):
            return jsonify({'error': 'News not found'}), 404
        
        # 获取对应索引的新闻
        news = news_list[news_id]
        
        # 构建返回数据
        result = {
            'date': daily.date.strftime('%Y-%m-%d'),
            'title': news.title,
            'summary': news.summary,
            'content': news.content,
            'source': news.source,
            'sourceLink': news.source_link,
            'link': news.link,
            'tags': news.tags if news.tags else []
        }
        
        return jsonify(result)
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    except Exception as e:
        app.logger.error(f'Error fetching news detail: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# AI教程接口
@app.route('/api/ai-tutorial', methods=['GET'])
def get_ai_tutorials():
    db = get_db()
    try:
        # 获取语言参数，默认为中文
        language = request.args.get('lang', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 查询所有教程（指定语言），按分类和排序索引排序
        tutorials = db.query(AITutorial).filter(
            AITutorial.language == language
        ).order_by(AITutorial.category, AITutorial.order_index).all()
        
        result = []
        for tutorial in tutorials:
            result.append({
                'id': tutorial.id,
                'category': tutorial.category,
                'title': tutorial.title,
                'description': tutorial.description,
                'content': tutorial.content,
                'link': tutorial.link,
                'tags': tutorial.tags if tutorial.tags else []
            })
        
        return jsonify(result)
    except Exception as e:
        app.logger.error(f'Error fetching tutorials: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

# 健康检查接口
@app.route('/api/health', methods=['GET'])
def health_check():
    db = get_db()
    try:
        # 测试数据库连接
        db.execute(text('SELECT 1'))
        db_status = 'ok'
    except Exception as e:
        db_status = f'error: {str(e)}'
    finally:
        db.close()
    
    return jsonify({
        'status': 'ok',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = app.config['PORT']
    app.run(host='0.0.0.0', port=port, debug=True)
