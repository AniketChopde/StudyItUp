"""
Quiz API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from loguru import logger
import uuid
from datetime import datetime

from database.connection import get_db
from models.quiz import (
    QuizSession, QuizGenerate, QuizSubmit,
    QuizResponse, QuizResultResponse, QuizHistoryEntry, TestCenterGenerate
)
from utils.auth import get_current_user, TokenData
from agents.quiz_agent import quiz_agent
from services.vector_store import vector_store_service
from tasks.quiz_tasks import generate_test_center_questions_task

router = APIRouter()


@router.post("/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def generate_quiz(
    quiz_data: QuizGenerate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new quiz."""
    try:
        # Generate questions using quiz agent
        questions = await quiz_agent.generate_questions(
            topic=quiz_data.topic,
            count=quiz_data.question_count,
            difficulty=quiz_data.difficulty,
            exam_type=quiz_data.exam_type
        )
        
        # Create quiz session
        quiz_session = QuizSession(
            user_id=current_user.user_id,
            topic=quiz_data.topic,
            subject=quiz_data.subject,
            difficulty=quiz_data.difficulty,
            questions=questions,
            total_questions=len(questions)
        )
        
        db.add(quiz_session)
        await db.commit()
        await db.refresh(quiz_session)
        
        logger.info(f"Quiz generated for user: {current_user.email}")
        return quiz_session
    
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Fast path: 20 questions, one LLM call, no search/PYQ — target <10s
TEST_CENTER_QUESTION_COUNT = 20
TEST_CENTER_DURATION_MINUTES = 60


@router.post("/test-center", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def start_test_center(
    test_data: TestCenterGenerate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a pending Test Center session and enqueue question generation. Returns immediately."""
    try:
        from sqlalchemy import func
        
        # Global Cache Check: Look for an existing test center simulation for this exam_name
        cached_test_result = await db.execute(
            select(QuizSession)
            .where(
                func.lower(QuizSession.topic) == test_data.exam_name.lower(),
                QuizSession.time_limit_minutes == TEST_CENTER_DURATION_MINUTES,
                QuizSession.questions != [],
                QuizSession.total_questions > 0
            )
            .limit(1)
        )
        cached_test = cached_test_result.scalar_one_or_none()

        if cached_test and len(cached_test.questions) > 0:
            logger.info(f"♻️ REUSING existing Test Center Simulation for: {test_data.exam_name}")
            quiz_session = QuizSession(
                user_id=current_user.user_id,
                topic=cached_test.topic,
                subject=cached_test.subject,
                difficulty=cached_test.difficulty,
                questions=cached_test.questions,
                total_questions=cached_test.total_questions,
                time_limit_minutes=TEST_CENTER_DURATION_MINUTES,
                status="in_progress",
            )
            db.add(quiz_session)
            await db.commit()
            await db.refresh(quiz_session)
            return quiz_session

        # Generation Pathway
        logger.info(f"Test Center requested for exam: {test_data.exam_name} (async)")
        quiz_session = QuizSession(
            user_id=current_user.user_id,
            topic=test_data.exam_name,
            subject="General",
            difficulty="hard",
            questions=[],
            total_questions=0,
            time_limit_minutes=TEST_CENTER_DURATION_MINUTES,
            status="pending",
        )
        db.add(quiz_session)
        await db.commit()
        await db.refresh(quiz_session)
        generate_test_center_questions_task.delay(str(quiz_session.id), test_data.exam_name, test_data.plan_id, test_data.language)
        logger.info(f"Test Center session {quiz_session.id} created (pending), task enqueued in {test_data.language}")
        return quiz_session
    except Exception as e:
        logger.error(f"Error starting test center: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize Test Center: {str(e)}",
        )


@router.get("/test-center/status/{session_id}", response_model=QuizResponse)
async def get_test_center_status(
    session_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Poll until Test Center session is ready (status != pending, questions loaded)."""
    result = await db.execute(
        select(QuizSession).where(
            QuizSession.id == session_id,
            QuizSession.user_id == current_user.user_id,
        )
    )
    quiz_session = result.scalar_one_or_none()
    if not quiz_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found",
        )
    return quiz_session


@router.post("/chapter/{chapter_id}/generate", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def generate_chapter_quiz(
    chapter_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate quiz for a chapter with PYQ (Previous Year Questions) search.
    This is NOW the ONLY place where PYQ search happens - NOT during teaching!
    
    Performance: Separated from teaching to avoid 5-minute delays
    """
    try:
        from models.study_plan import StudyPlanChapter,StudyPlan
        from agents.search_agent import search_agent
        
        logger.info(f"🎯 Generating quiz for chapter {chapter_id} (with PYQ search)")
        
        # Get chapter details
        result = await db.execute(
            select(StudyPlanChapter)
            .join(StudyPlan)
            .where(
                StudyPlanChapter.id == chapter_id,
                StudyPlan.user_id == current_user.user_id
            )
        )
        chapter = result.scalar_one_or_none()
        
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found"
            )
        
        # Get exam type and language from the study plan
        plan_result = await db.execute(
            select(StudyPlan).where(StudyPlan.id == chapter.plan_id)
        )
        plan = plan_result.scalar_one_or_none()
        exam_type = plan.exam_type if plan else "General"
        plan_language = plan.language if (plan and hasattr(plan, "language")) else "English"
        
        # 1. Global Cache Check
        from sqlalchemy import func
        cached_quiz_result = await db.execute(
            select(QuizSession)
            .where(
                func.lower(QuizSession.topic) == chapter.chapter_name.lower(),
                func.lower(QuizSession.subject) == exam_type.lower(),
                QuizSession.questions != [],
                QuizSession.total_questions > 0
            )
            .limit(1)
        )
        cached_quiz = cached_quiz_result.scalar_one_or_none()
        
        if cached_quiz and len(cached_quiz.questions) > 0:
            logger.info(f"♻️ REUSING existing Chapter Quiz for: {chapter.chapter_name}")
            quiz_session = QuizSession(
                user_id=current_user.user_id,
                topic=cached_quiz.topic,
                subject=cached_quiz.subject,
                difficulty=cached_quiz.difficulty,
                questions=cached_quiz.questions,
                total_questions=cached_quiz.total_questions,
                status="in_progress" # Reset status for new user
            )
            db.add(quiz_session)
            await db.commit()
            await db.refresh(quiz_session)
            return quiz_session

        # 2. Generation Pathway
        topics = chapter.topics if isinstance(chapter.topics, list) else [chapter.topics]
        
        # Pull context from vector store if available
        pdf_context = ""
        try:
            search_results = await vector_store_service.search(
                module_id=str(chapter.plan_id),
                query=" ".join(topics),
                top_k=5
            )
            if search_results:
                pdf_context = "\n\n".join([doc.get("text", "") for doc in search_results])
                logger.info(f"Retrieved {len(search_results)} chunks from PDF context for quiz generation.")
        except Exception as e:
            logger.warning(f"Failed to fetch PDF context for quiz generation: {str(e)}")
            
        # ULTRA-OPTIMIZED: Generate questions for all topics in ONE BATCH
        all_questions = await quiz_agent.generate_chapter_questions(
            topics=topics,
            exam_type=exam_type,
            total_count=15, # Standard chapter quiz size
            pdf_context=pdf_context,
            language=plan_language
        )
        
        # Create quiz session
        quiz_session = QuizSession(
            user_id=current_user.user_id,
            topic=chapter.chapter_name,
            subject=exam_type,
            difficulty="medium",
            questions=all_questions,
            total_questions=len(all_questions)
        )
        
        db.add(quiz_session)
        await db.commit()
        await db.refresh(quiz_session)
        
        logger.info(f"✅ Chapter quiz generated: {len(all_questions)} questions")
        return quiz_session
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating chapter quiz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(e)}"
        )


@router.post("/submit", response_model=QuizResultResponse)
async def submit_quiz(
    submission: QuizSubmit,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit quiz answers and get results."""
    try:
        # Get quiz session
        result = await db.execute(
            select(QuizSession).where(
                QuizSession.id == submission.quiz_id,
                QuizSession.user_id == current_user.user_id
            )
        )
        quiz_session = result.scalar_one_or_none()
        
        if not quiz_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Calculate score
        quiz_data = {
            "questions": quiz_session.questions,
            "answers": submission.answers
        }
        
        score_data = await quiz_agent.calculate_score(quiz_data)
        
        # Update quiz session
        quiz_session.answers = submission.answers
        quiz_session.score = score_data["percentage"]
        quiz_session.correct_answers = score_data["correct_answers"]
        quiz_session.time_taken_seconds = submission.time_taken_seconds
        quiz_session.status = "completed"
        quiz_session.completed_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(quiz_session)
        
        logger.info(f"Quiz submitted: {submission.quiz_id}")
        
        return {
            **quiz_session.__dict__,
            "detailed_results": score_data["detailed_results"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/history", response_model=List[QuizHistoryEntry])
async def get_quiz_history(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get quiz history for current user: only completed attempts (submitted quizzes with score)."""
    try:
        result = await db.execute(
            select(QuizSession)
            .where(
                QuizSession.user_id == current_user.user_id,
                QuizSession.status == "completed",
            )
            .order_by(QuizSession.completed_at.desc(), QuizSession.created_at.desc())
        )
        quizzes = result.scalars().all()
        return quizzes
    
    except Exception as e:
        logger.error(f"Error fetching quiz history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch quiz history"
        )

@router.get("/{quiz_id}", response_model=QuizResultResponse)
async def get_quiz_result(
    quiz_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed results for a specific quiz."""
    try:
        result = await db.execute(
            select(QuizSession).where(
                QuizSession.id == quiz_id,
                QuizSession.user_id == current_user.user_id
            )
        )
        quiz_session = result.scalar_one_or_none()
        
        if not quiz_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
            
        # Re-calculate detailed results since we don't store them
        # We need them for the frontend to show the detailed breakdown
        quiz_data = {
            "questions": quiz_session.questions,
            "answers": quiz_session.answers
        }
        
        # Calculate details (Score is already in DB, but we need the breakdown)
        score_data = await quiz_agent.calculate_score(quiz_data)
        
        return {
            **quiz_session.__dict__,
            "detailed_results": score_data["detailed_results"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch quiz details"
        )
