"""
Celery tasks for quiz generation (Test Center async flow).
"""

import asyncio
import uuid
from loguru import logger
from sqlalchemy import select

from celery_app import app
from database.connection import AsyncSessionLocal
from models.quiz import QuizSession
from agents.quiz_agent import quiz_agent
from services.vector_store import vector_store_service

TEST_CENTER_QUESTION_COUNT = 20


async def _generate_and_update_session(session_id: str, exam_name: str, plan_id: str = None, language: str = "English") -> None:
    """Generate Test Center questions and update the session. Runs in async context."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(QuizSession).where(QuizSession.id == uuid.UUID(session_id))
        )
        session = result.scalar_one_or_none()
        if not session:
            logger.warning(f"Test Center task: session {session_id} not found")
            return
        if session.status != "pending":
            logger.info(f"Test Center task: session {session_id} already has status {session.status}, skipping")
            return

        try:
            pdf_context = ""
            if plan_id:
                try:
                    search_results = await vector_store_service.search(
                        module_id=plan_id,
                        query=exam_name,
                        top_k=5
                    )
                    if search_results:
                        pdf_context = "\n\n".join([doc.get("text", "") for doc in search_results])
                        logger.info(f"Retrieved {len(search_results)} chunks from PDF context for test center generation.")
                except Exception as e:
                    logger.warning(f"Failed to fetch PDF context for test center: {str(e)}")

            all_questions = await quiz_agent.generate_test_center_questions(
                topic=exam_name,
                count=TEST_CENTER_QUESTION_COUNT,
                exam_type=exam_name,
                skip_pyq=True,
                pdf_context=pdf_context,
                language=language
            )
            all_questions = all_questions[:TEST_CENTER_QUESTION_COUNT]
            if len(all_questions) < TEST_CENTER_QUESTION_COUNT:
                logger.warning(f"Got {len(all_questions)} questions, expected {TEST_CENTER_QUESTION_COUNT}")

            session.questions = all_questions
            session.total_questions = len(all_questions)
            session.status = "in_progress"
            await db.commit()
            logger.info(f"Test Center ready: session {session_id}, {len(all_questions)} questions")
        except Exception as e:
            await db.rollback()
            logger.error(f"Test Center task failed for session {session_id}: {e}")
            raise


@app.task(bind=True, max_retries=2, autoretry_for=(Exception,))
def generate_test_center_questions_task(self, session_id: str, exam_name: str, plan_id: str = None, language: str = "English"):
    """
    Generate Test Center questions in the background and update the session.
    Runs async quiz_agent code via a new event loop.
    """
    logger.info(f"Test Center task started: session_id={session_id}, exam_name={exam_name}")
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_generate_and_update_session(session_id, exam_name, plan_id, language))
        finally:
            loop.close()
    except Exception as exc:
        logger.exception(f"Test Center task error: {exc}")
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
