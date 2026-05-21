"""
Study Plan API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Dict, Any
from loguru import logger
import uuid
from langfuse import observe, propagate_attributes

from database.connection import get_db
from models.study_plan import (
    StudyPlan, StudyPlanCreate, StudyPlanResponse,
    StudyPlanChapter, ChapterResponse, StudyPlanCreateResponse
)
from utils.auth import get_current_user, TokenData
from agents.orchestrator import orchestrator

router = APIRouter()


async def smart_sync_plans(db: AsyncSession, current_user_id: uuid.UUID, plans: List[Any]):
    """
    Smart Sync: auto-complete chapters based on quiz scores and then auto-complete plans.
    Demonstrates true mastery by analyzing quiz history.
    """
    # 1. Fetch user's max quiz scores
    from models.quiz import QuizSession
    quiz_result = await db.execute(
        select(QuizSession.topic, func.max(QuizSession.score).label("max_score"))
        .where(QuizSession.user_id == current_user_id, QuizSession.status == "completed")
        .group_by(QuizSession.topic)
    )
    quiz_scores = {row.topic.lower(): row.max_score for row in quiz_result if row.max_score is not None}
    
    updated_any = False
    
    for plan in plans:
        plan_updated = False
        if plan.chapters:
            for chapter in plan.chapters:
                if chapter.status != "completed":
                    # Check if chapter name or any of its topics match a high-score quiz
                    score = quiz_scores.get(chapter.chapter_name.lower(), 0)
                    if score < 70:
                        # Try matching topics
                        for topic in chapter.topics:
                            topic_score = quiz_scores.get(topic.lower(), 0)
                            if topic_score >= 70:
                                score = topic_score
                                break
                    
                    
                    if score >= 70:
                        logger.info(f"✨ Smart Sync: Marking chapter '{chapter.chapter_name}' as completed (Score: {score}%)")
                        chapter.status = "completed"
                        plan_updated = True
                        updated_any = True
        
        # 2. Check if the entire plan is now done
        if plan.status == "active":
            if all(ch.status == "completed" for ch in plan.chapters):
                logger.info(f"🏆 Smart Sync: Marking plan as completed: {plan.id}")
                plan.status = "completed"
                plan_updated = True
                updated_any = True
    
    if updated_any:
        await db.commit()
    
    return plans


async def pregenerate_remaining_chapters(plan_id: uuid.UUID):
    """
    Background task to pre-generate teaching content for all chapters in a study plan.
    Runs silently after plan creation or when plan is loaded.
    """
    from database.connection import AsyncSessionLocal
    from models.study_plan import StudyPlanChapter, StudyPlan
    from sqlalchemy.orm import selectinload
    from sqlalchemy import select
    from agents.orchestrator import orchestrator
    import asyncio
    
    logger.info(f"Background pre-generation started for plan {plan_id}")
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch study plan with chapters
            result = await db.execute(
                select(StudyPlan)
                .where(StudyPlan.id == plan_id)
                .options(selectinload(StudyPlan.chapters))
            )
            plan = result.scalar_one_or_none()
            if not plan:
                logger.warning(f"Plan {plan_id} not found in background task.")
                return
            
            # 2. Iterate through chapters in order
            for chapter in sorted(plan.chapters, key=lambda c: c.order_index):
                # If chapter already has valid content, skip it!
                if chapter.content and chapter.content.get("topic_lessons"):
                    lessons = chapter.content.get("topic_lessons", [])
                    if lessons and lessons[0].get("main_explanation"):
                        logger.info(f"Chapter '{chapter.chapter_name}' already has content. Skipping.")
                        continue
                
                # Pre-generate content for this chapter
                logger.info(f"Background generating content for chapter '{chapter.chapter_name}'")
                try:
                    teaching_content = await orchestrator.handle_chapter_teaching(
                        chapter_id=str(chapter.id),
                        chapter_name=chapter.chapter_name,
                        topics=chapter.topics if isinstance(chapter.topics, list) else [chapter.topics],
                        db=db,
                        exam_type=plan.exam_type,
                        language=plan.language
                    )
                    
                    # Fetch fresh chapter within the current session block to prevent bound instances error
                    chapter_result = await db.execute(
                        select(StudyPlanChapter).where(StudyPlanChapter.id == chapter.id)
                    )
                    db_chapter = chapter_result.scalar_one_or_none()
                    if db_chapter:
                        db_chapter.content = teaching_content
                        await db.commit()
                        logger.info(f"✅ Background generated and saved content for chapter '{chapter.chapter_name}'")
                except Exception as ex:
                    logger.error(f"❌ Failed to background generate chapter '{chapter.chapter_name}': {ex}")
                    await db.rollback()
                
                # Small pause between chapters to avoid overloading the LLM rate limit or db
                await asyncio.sleep(2)
                
        except Exception as e:
            logger.error(f"Error in background pregeneration: {e}")


@router.post("/create", response_model=StudyPlanCreateResponse, status_code=status.HTTP_201_CREATED)
@observe()
async def create_study_plan(
    plan_data: StudyPlanCreate,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a comprehensive study plan using multi-agent system."""
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            from sqlalchemy import func
            from datetime import date, datetime
            def get_days_diff(start, end):
                try:
                    start_date_obj = datetime.strptime(start, "%Y-%m-%d").date() if isinstance(start, str) else start
                    end_date_obj = datetime.strptime(end, "%Y-%m-%d").date() if isinstance(end, str) else end
                    if isinstance(start_date_obj, datetime):
                        start_date_obj = start_date_obj.date()
                    if isinstance(end_date_obj, datetime):
                        end_date_obj = end_date_obj.date()
                    return (end_date_obj - start_date_obj).days + 1
                except Exception:
                    return 0
            
            # Fetch user to get profile data
            from models.user import User
            user_result = await db.execute(select(User).where(User.id == current_user.user_id))
            full_user = user_result.scalar_one_or_none()
            user_profile = full_user.profile_data if full_user else {}

            
            # 1. Global Cache Check: Look for an existing plan for this exact exam_type and language
            cached_plan = None
            if not plan_data.force_regenerate:
                cached_plan_result = await db.execute(
                    select(StudyPlan)
                    .where(
                        func.lower(func.trim(StudyPlan.exam_type)) == plan_data.exam_type.strip().lower(),
                        func.lower(func.trim(StudyPlan.language)) == plan_data.language.strip().lower()
                    )
                    .options(selectinload(StudyPlan.chapters))
                    .order_by(StudyPlan.created_at.desc())
                )
                
                # Compute requested duration in days
                req_days = get_days_diff(plan_data.start_date, plan_data.target_date)
                
                # Find the first valid plan (must have chapters and match target duration constraints)
                for plan in cached_plan_result.scalars().all():
                    if plan.chapters:
                        plan_days = get_days_diff(plan.start_date, plan.target_date)
                        if req_days > 0 and plan_days > 0:
                            # For short-term plans <= 7 days, enforce an exact day match
                            if req_days <= 7:
                                if plan_days == req_days and len(plan.chapters) == req_days:
                                    cached_plan = plan
                                    break
                            # For longer plans, allow a variance of up to 2 days
                            else:
                                if abs(plan_days - req_days) <= 2:
                                    cached_plan = plan
                                    break
                        else:
                            # Fallback to standard check if date parsing failed
                            cached_plan = plan
                            break

            if cached_plan:
                logger.info(f"♻️ REUSING existing Study Plan for: {plan_data.exam_type} ({plan_data.language})")
                
                study_plan = StudyPlan(
                    user_id=current_user.user_id,
                    exam_type=plan_data.exam_type,
                    start_date=plan_data.start_date,
                    target_date=plan_data.target_date,
                    daily_hours=plan_data.daily_hours,
                    language=plan_data.language,
                    current_knowledge=plan_data.current_knowledge,
                    plan_metadata=cached_plan.plan_metadata,
                    recommended_courses=cached_plan.recommended_courses
                )
                db.add(study_plan)
                await db.flush()
                
                ratio = plan_data.daily_hours / max(float(cached_plan.daily_hours or 1.0), 1.0)
                
                for chapter in cached_plan.chapters:
                    new_chapter = StudyPlanChapter(
                        plan_id=study_plan.id,
                        chapter_name=chapter.chapter_name,
                        subject=chapter.subject,
                        topics=chapter.topics,
                        estimated_hours=max(1, int(float(chapter.estimated_hours or 1) * ratio)),
                        order_index=chapter.order_index,
                        status="pending",
                        weightage_percent=chapter.weightage_percent,
                        weightage_source=chapter.weightage_source,
                        resources=chapter.resources,
                        content=chapter.content  # Reuse teaching content from cache
                    )
                    db.add(new_chapter)
                    
                await db.commit()
                
                final_plan = await db.execute(
                    select(StudyPlan)
                    .where(StudyPlan.id == study_plan.id)
                    .options(selectinload(StudyPlan.chapters))
                )
                return {
                    "study_plan": final_plan.scalar_one(),
                    "ai_metadata": {
                        "exam_info": cached_plan.plan_metadata.get("official_syllabus", {}),
                        "plan_analysis": cached_plan.plan_metadata.get("goal_analysis", {}),
                        "immediate_actions": []
                    }
                }
                
            # 2. Generation (If no cache found)
            # Use orchestrator to create comprehensive plan (exam_type can be any learning goal: ML, LangChain, UPSC, etc.)
            result = await orchestrator.handle_exam_preparation(
                user_goal=f"Learn {plan_data.exam_type}",
                exam_type=plan_data.exam_type,
                target_date=plan_data.target_date,
                start_date=plan_data.start_date,
                daily_hours=plan_data.daily_hours,
                current_knowledge=plan_data.current_knowledge,
                fast_learn=plan_data.fast_learn,
                language=plan_data.language,
                user_profile=user_profile
            )
            
            # Create study plan in database with full metadata
            plan_metadata = result.get("study_plan", {})
            plan_metadata["official_syllabus"] = result.get("exam_info", {})
            plan_metadata["goal_analysis"] = result.get("goal_analysis", {})
            
            study_plan = StudyPlan(
                user_id=current_user.user_id,
                exam_type=plan_data.exam_type,
                start_date=plan_data.start_date,
                target_date=plan_data.target_date,
                daily_hours=plan_data.daily_hours,
                language=plan_data.language,
                current_knowledge=plan_data.current_knowledge,
                plan_metadata=plan_metadata
            )
            
            db.add(study_plan)
            await db.flush()  # Get the ID without committing yet
            
            # Extract chapters from modules
            plan_data_ai = result.get("study_plan", {})
            modules = plan_data_ai.get("modules", [])
            
            # Safety fallback if AI failed completely
            if not modules:
                logger.warning(f"No modules found in AI response for {plan_data.exam_type}. Using fallback.")
                modules = [{
                    "module_name": "Fundamentals & Assessment",
                    "estimated_days": "7",
                    "difficulty": "Medium",
                    "topics": ["Exam Pattern Overview", "Current Knowledge Assessment"]
                }]

            # Dynamic adjustment according to exact chosen dates & plan selection (especially for short plans <= 7 days)
            req_days = get_days_diff(plan_data.start_date, plan_data.target_date)
            if req_days > 0 and req_days <= 7:
                if len(modules) != req_days:
                    logger.info(f"⚙️ Dynamic Adjustment: AI returned {len(modules)} modules for a {req_days}-day study plan. Programmatically adjusting modules count to exactly {req_days}.")
                    if len(modules) > req_days:
                        # Keep first req_days - 1 modules as is
                        keep_modules = modules[:req_days]
                        excess_modules = modules[req_days:]
                        # Merge the excess modules' topics and details into the last module
                        last_module = keep_modules[-1]
                        last_module["topics"] = list(last_module.get("topics", []))
                        for em in excess_modules:
                            last_module["topics"].extend(em.get("topics", []))
                            last_module["module_name"] = f"{last_module['module_name']} & {em.get('module_name')}"
                        # Ensure the combined topics list doesn't contain duplicates and module name is truncated if too long
                        last_module["topics"] = list(dict.fromkeys(last_module["topics"]))
                        if len(last_module["module_name"]) > 60:
                            last_module["module_name"] = last_module["module_name"][:57] + "..."
                        modules = keep_modules
                    else:
                        # Pad the modules list until it matches req_days
                        while len(modules) < req_days:
                            modules.append({
                                "module_name": "Practice & Final Review",
                                "estimated_days": "1",
                                "difficulty": "Medium",
                                "topics": ["Comprehensive assessment practice", "Reviewing focus areas"],
                                "weightage_percent": 10.0
                            })
                
                # Enforce estimated_days to be exactly 1 for all modules
                for module in modules:
                    module["estimated_days"] = "1"
                
                # Normalize weightages to sum to 100
                total_weight = sum(float(m.get("weightage_percent", 0.0)) for m in modules)
                if total_weight > 0:
                    for m in modules:
                        m["weightage_percent"] = round((float(m.get("weightage_percent", 0.0)) / total_weight) * 100.0, 1)
                else:
                    weight_per_mod = round(100.0 / len(modules), 1)
                    for m in modules:
                        m["weightage_percent"] = weight_per_mod
            else:
                # For longer plans, make sure estimated_days is always a safe integer-like string >= 1
                for module in modules:
                    try:
                        days_float = float(module.get("estimated_days", 1))
                        # Enforce minimum of 1 day and round to nearest integer
                        days_int = max(1, round(days_float))
                        module["estimated_days"] = str(days_int)
                    except Exception:
                        module["estimated_days"] = "1"

            # Update the stored plan_metadata modules to be perfectly consistent in DB
            plan_metadata["modules"] = modules
            study_plan.plan_metadata = plan_metadata

            first_chapter = None
            for idx, module in enumerate(modules):
                module_name = module.get("module_name", f"Module {idx+1}")
                topics = module.get("topics", [])
                
                # Since we now use Research Agent on-demand, we don't pre-fetch all resources here
                chapter = StudyPlanChapter(
                    plan_id=study_plan.id,
                    chapter_name=module_name,
                    subject=plan_data.exam_type,
                    topics=topics,
                    estimated_hours=max(1, round(float(module.get("estimated_days", 1)) * plan_data.daily_hours)),
                    order_index=idx,
                    status="pending",
                    weightage_percent=float(module.get("weightage_percent", 0.0)),
                    weightage_source="ai_estimate",
                    resources=[] # Resources will be grounded via Research Agent during teaching
                )
                db.add(chapter)
                if idx == 0:
                    first_chapter = chapter
                
            await db.flush()  # Populates first_chapter.id
            
            # Pre-generate teaching content for the very first chapter (Week 1)
            # This ensures that when the user lands on the study plan details,
            # clicking "Start Deep Lesson" on Week 1 loads instantly without a 30s spinner!
            if first_chapter:
                try:
                    logger.info(f"⏳ Pre-generating teaching content for Week 1 chapter: '{first_chapter.chapter_name}'")
                    teaching_content = await orchestrator.handle_chapter_teaching(
                        chapter_id=str(first_chapter.id),
                        chapter_name=first_chapter.chapter_name,
                        topics=first_chapter.topics if isinstance(first_chapter.topics, list) else [first_chapter.topics],
                        db=db,
                        exam_type=study_plan.exam_type,
                        language=study_plan.language
                    )
                    first_chapter.content = teaching_content
                except Exception as ex:
                    logger.warning(f"⚠️ Failed to pre-generate first chapter content (will generate on-demand): {ex}")
                
            await db.commit()
            await db.refresh(study_plan)
            
            # Trigger background generation for remaining chapters!
            background_tasks.add_task(pregenerate_remaining_chapters, study_plan.id)
            
            # (Course recommendations are fetched asynchronously by the frontend when needed)
            
            # Re-fetch with chapters for the response
            final_plan = await db.execute(
                select(StudyPlan)
                .where(StudyPlan.id == study_plan.id)
                .options(selectinload(StudyPlan.chapters))
            )
            plan_obj = final_plan.scalar_one()

            return {
                "study_plan": plan_obj,
                "ai_metadata": {
                    "exam_info": result.get("exam_info"),
                    "plan_analysis": result.get("goal_analysis"),
                    "immediate_actions": result.get("immediate_actions")
                }
            }
            
    except Exception as e:
        logger.error(f"Error creating study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{plan_id}", response_model=StudyPlanResponse)
@observe()
async def update_study_plan(
    plan_id: uuid.UUID,
    plan_data: Dict[str, Any],
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update study plan status or metadata."""
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            result = await db.execute(
                select(StudyPlan).where(
                    StudyPlan.id == plan_id,
                    StudyPlan.user_id == current_user.user_id
                ).options(selectinload(StudyPlan.chapters))
            )
            plan = result.scalar_one_or_none()
            
            if not plan:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Study plan not found"
                )
            
            for key, value in plan_data.items():
                if hasattr(plan, key):
                    setattr(plan, key, value)
            
            await db.commit()
            await db.refresh(plan)
            return plan
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/", response_model=List[StudyPlanResponse])
async def list_study_plans(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all study plans for current user."""
    try:
        result = await db.execute(
            select(StudyPlan)
            .where(StudyPlan.user_id == current_user.user_id)
            .options(selectinload(StudyPlan.chapters))
            .order_by(StudyPlan.created_at.desc())
        )
        plans = result.scalars().all()
        await smart_sync_plans(db, current_user.user_id, plans)
        return plans
    except Exception as e:
        logger.error(f"Error listing study plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch study plans"
        )


@router.get("/{plan_id}", response_model=StudyPlanResponse)
async def get_study_plan(
    plan_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get study plan by ID."""
    try:
        result = await db.execute(
            select(StudyPlan)
            .where(
                StudyPlan.id == plan_id,
                StudyPlan.user_id == current_user.user_id
            )
            .options(selectinload(StudyPlan.chapters))
        )
        plan = result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study plan not found"
            )
        
        # Run smart sync for this single plan
        await smart_sync_plans(db, current_user.user_id, [plan])
        
        # Trigger background generation to backfill any missing chapter contents!
        background_tasks.add_task(pregenerate_remaining_chapters, plan.id)
        
        return plan
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch study plan"
        )


@router.get("/{plan_id}/courses", response_model=List[Dict[str, Any]])
async def get_plan_courses(
    plan_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recommended courses for a study plan."""
    try:
        result = await db.execute(
            select(StudyPlan)
            .where(
                StudyPlan.id == plan_id,
                StudyPlan.user_id == current_user.user_id
            )
        )
        plan = result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study plan not found"
            )
            
        # If courses are missing, generate them on-demand
        if not plan.recommended_courses:
            try:
                from agents.course_recommendation_agent import course_recommendation_agent
                recommendations = await course_recommendation_agent.recommend_courses(
                    exam_type=plan.exam_type,
                    current_knowledge=plan.current_knowledge,
                    language=getattr(plan, "language", "English") or "English"
                )
                
                # Update database
                plan.recommended_courses = recommendations
                await db.commit()
                return recommendations
            except Exception as e:
                logger.error(f"Error generating on-demand courses: {str(e)}")
                return []
                
        return plan.recommended_courses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching plan courses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch courses"
        )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study_plan(
    plan_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a study plan."""
    try:
        result = await db.execute(
            select(StudyPlan).where(
                StudyPlan.id == plan_id,
                StudyPlan.user_id == current_user.user_id
            )
        )
        plan = result.scalar_one_or_none()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study plan not found"
            )
        
        await db.delete(plan)
        await db.commit()
        
        logger.info(f"Study plan deleted: {plan_id}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study plan: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete study plan"
        )
@router.patch("/chapter/{chapter_id}", response_model=ChapterResponse)
async def update_chapter_status(
    chapter_id: uuid.UUID,
    status_data: Dict[str, str],
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update chapter status (pending, in_progress, completed)."""
    try:
        new_status = status_data.get("status")
        if new_status not in ["pending", "in_progress", "completed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be pending, in_progress, or completed"
            )

        # Get the chapter and check ownership via plan
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
            
        chapter.status = new_status
        await db.commit()
        await db.refresh(chapter)
        
        # Check if all chapters in the plan are completed
        if new_status == "completed":
            plan_result = await db.execute(
                select(StudyPlan)
                .where(StudyPlan.id == chapter.plan_id)
                .options(selectinload(StudyPlan.chapters))
            )
            plan = plan_result.scalar_one_or_none()
            if plan:
                all_done = all(ch.status == "completed" for ch in plan.chapters)
                if all_done:
                    logger.info(f"🏆 study plan fully completed: {plan.id}")
                    plan.status = "completed"
                    await db.commit()
        
        return chapter
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating chapter status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update chapter status"
        )
@router.post("/chapter/{chapter_id}/teach")
async def teach_chapter(
    chapter_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate teaching content for a chapter."""
    try:
        # Get chapter details with plan info
        result = await db.execute(
            select(StudyPlanChapter)
            .options(selectinload(StudyPlanChapter.study_plan))
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
        
        # If content already exists and is valid (check for main_explanation), return it
        if chapter.content and chapter.content.get("topic_lessons"):
            lessons = chapter.content.get("topic_lessons", [])
            if lessons and lessons[0].get("main_explanation"):
                return chapter.content
            
        # Generate learning content using orchestrator
        teaching_content = await orchestrator.handle_chapter_teaching(
            chapter_id=str(chapter.id),
            chapter_name=chapter.chapter_name,
            topics=chapter.topics if isinstance(chapter.topics, list) else [chapter.topics],
            db=db,
            exam_type=chapter.study_plan.exam_type,
            language=chapter.study_plan.language
        )
        
        # Save content to database
        chapter.content = teaching_content
        await db.commit()
        await db.refresh(chapter)
        
        return teaching_content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error teaching chapter: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate teaching content"
        )
