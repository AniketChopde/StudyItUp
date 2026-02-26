"""
Dashboard / analytics API – user progress stats for the dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, date, timedelta
from loguru import logger

from database.connection import get_db
from models.study_plan import StudyPlan, StudyPlanChapter
from models.quiz import QuizSession
from utils.auth import get_current_user, TokenData

router = APIRouter()


def _compute_streak(activity_dates: list[date]) -> int:
    """
    Compute consecutive-day streak ending on the most recent activity date.
    activity_dates: list of distinct dates (UTC date) when user had activity, sorted desc.
    """
    if not activity_dates:
        return 0
    # Use set for O(1) lookup
    seen = set(activity_dates)
    # Streak ends on the latest activity day
    end = max(seen)
    today_utc = date.today()
    # If latest activity was in the future (timezone edge case), use today
    if end > today_utc:
        end = today_utc
    # If latest activity is not today or yesterday, streak is broken
    if end < today_utc - timedelta(days=1):
        return 0
    streak = 0
    d = end
    while d in seen:
        streak += 1
        d -= timedelta(days=1)
    return streak


@router.get("/stats")
async def get_dashboard_stats(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return dashboard stats for the current user: study streak, hours studied,
    topics completed (X/Y), and quiz average. All derived from DB (quizzes + study plans).
    """
    try:
        user_id = current_user.user_id

        # --- Quiz stats: completed quizzes only ---
        completed_quizzes = await db.execute(
            select(QuizSession)
            .where(
                QuizSession.user_id == user_id,
                QuizSession.status == "completed",
                QuizSession.completed_at.isnot(None),
            )
        )
        completed_list = completed_quizzes.scalars().all()

        # Activity dates for streak (use completed_at date)
        activity_dates = []
        total_seconds = 0.0
        total_score = 0.0
        score_count = 0
        for q in completed_list:
            if q.completed_at:
                activity_dates.append(q.completed_at.date())
            if q.time_taken_seconds is not None:
                total_seconds += q.time_taken_seconds
            if q.score is not None:
                total_score += q.score
                score_count += 1

        study_streak = _compute_streak(list(set(activity_dates)))
        hours_studied = round(total_seconds / 3600.0, 1)
        quiz_average = round(total_score / score_count, 0) if score_count else None

        # --- Study plan: topics completed / total (across user's plans) ---
        plans_with_chapters = await db.execute(
            select(StudyPlan)
            .where(StudyPlan.user_id == user_id)
            .options(selectinload(StudyPlan.chapters))
        )
        plans = plans_with_chapters.scalars().all()

        total_topics = 0
        completed_topics = 0
        for plan in plans:
            for ch in plan.chapters:
                total_topics += 1
                if ch.status == "completed":
                    completed_topics += 1

        return {
            "study_streak_days": study_streak,
            "hours_studied": hours_studied,
            "topics_completed": completed_topics,
            "topics_total": total_topics,
            "quiz_average_percent": quiz_average,
        }
    except Exception as e:
        logger.error(f"Error computing dashboard stats: {str(e)}", exc_info=True)
        raise

@router.get("/topic-analysis")
async def get_topic_analysis(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze performance grouped by topic."""
    user_id = current_user.user_id
    result = await db.execute(
        select(QuizSession).where(
            QuizSession.user_id == user_id,
            QuizSession.status == "completed"
        )
    )
    quizzes = result.scalars().all()
    
    analysis = {}
    for q in quizzes:
        topic = q.topic
        if topic not in analysis:
            analysis[topic] = {
                "topic": topic,
                "subject": q.subject or "General",
                "avg_score": 0.0,
                "attempts": 0,
                "total_time": 0.0,
                "scores": []
            }
        
        # Keep subject updated to the latest one seen (usually they are consistent)
        if q.subject:
            analysis[topic]["subject"] = q.subject

        analysis[topic]["attempts"] += 1
        if q.score is not None:
            analysis[topic]["scores"].append(q.score)
        if q.time_taken_seconds:
            analysis[topic]["total_time"] += q.time_taken_seconds
            
    # Finalize averages
    output = []
    for topic, data in analysis.items():
        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 1) if data["scores"] else 0.0
        data["avg_time_seconds"] = round(data["total_time"] / data["attempts"], 1)
        del data["scores"]
        del data["total_time"]
        output.append(data)
        
    return sorted(output, key=lambda x: x["avg_score"], reverse=True)

@router.get("/subject-analysis")
async def get_subject_analysis(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze performance grouped by subject/exam_type."""
    user_id = current_user.user_id
    result = await db.execute(
        select(QuizSession).where(
            QuizSession.user_id == user_id,
            QuizSession.status == "completed"
        )
    )
    quizzes = result.scalars().all()
    
    analysis = {}
    for q in quizzes:
        subject = q.subject or "Uncategorized"
        if subject not in analysis:
            analysis[subject] = {
                "subject": subject,
                "avg_score": 0.0,
                "quiz_count": 0,
                "scores": []
            }
        
        analysis[subject]["quiz_count"] += 1
        if q.score is not None:
            analysis[subject]["scores"].append(q.score)
            
    output = []
    for subj, data in analysis.items():
        data["avg_score"] = round(sum(data["scores"]) / len(data["scores"]), 1) if data["scores"] else 0.0
        del data["scores"]
        output.append(data)
        
    return sorted(output, key=lambda x: x["avg_score"], reverse=True)

@router.get("/weak-strong")
async def get_weak_strong_analysis(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Categorize topics into Weak and Strong based on performance.
    Returns recommendations for each.
    """
    # 1. Reuse topic analysis logic
    topic_data = await get_topic_analysis(current_user, db)
    user_id = current_user.user_id

    # 2. Get user's study plan chapters to link recommendations to specific lessons
    plans_result = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.user_id == user_id)
        .options(selectinload(StudyPlan.chapters))
    )
    plans = plans_result.scalars().all()
    
    # Topic -> (plan_id, chapter_id) mapping
    topic_map = {}
    subject_map = {} # Fallback to most recent plan for a subject
    
    for plan in plans:
        # Subject mapping (keep the latest plan)
        subject_map[plan.exam_type.lower()] = plan.id
        
        for ch in plan.chapters:
            # We assume topic names in quizzes match topics in chapters (case-insensitive)
            chapter_topics = [t.lower() for t in (ch.topics or [])]
            for t in chapter_topics:
                topic_map[t] = (plan.id, ch.id)
            # Also check chapter name itself
            topic_map[ch.chapter_name.lower()] = (plan.id, ch.id)

    weak = []
    strong = []
    recommendations = []
    
    for item in topic_data:
        score = item["avg_score"]
        topic = item["topic"]
        subject = item.get("subject", "General")
        
        # 1. Direct topic match to chapter
        link_info = topic_map.get(topic.lower())
        plan_id, chapter_id = link_info if link_info else (None, None)
        
        # 2. Fallback: If topic name itself matches a study plan (exam type)
        if not plan_id:
            plan_id = subject_map.get(topic.lower())
            
        # 3. Fallback: Partial match (e.g. "Machine learning" matches "Machine learning Preparation")
        if not plan_id:
            for p_name, p_id in subject_map.items():
                if topic.lower() in p_name or p_name in topic.lower():
                    plan_id = p_id
                    break

        # 4. Fallback: If subject plan exists
        if not plan_id and subject:
            plan_id = subject_map.get(subject.lower())
            if not plan_id:
                for p_name, p_id in subject_map.items():
                    if subject.lower() in p_name or p_name in subject.lower():
                        plan_id = p_id
                        break
        
        if score < 60:
            weak.append(item)
            recommendations.append({
                "topic": topic,
                "subject": subject,
                "type": "improvement",
                "message": f"You're struggling with {topic} ({score}%). We recommend re-reading the chapter or asking for an explanation in Chat.",
                "action_link": "/chat",
                "plan_id": str(plan_id) if plan_id else None,
                "chapter_id": str(chapter_id) if chapter_id else None
            })
        elif score >= 80:
            strong.append(item)
            recommendations.append({
                "topic": topic,
                "subject": subject,
                "type": "mastery",
                "message": f"Excellent mastery of {topic}! You're ready for advanced mock tests.",
                "action_link": "/quiz"
            })
            
    return {
        "weak_topics": weak,
        "strong_topics": strong,
        "recommendations": recommendations
    }
