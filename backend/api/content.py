"""
API endpoints for content management and upload.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Query
from typing import Dict, Any, Optional
from loguru import logger

from services.content_ingestion import content_ingestion_service
from database.connection import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from utils.auth import get_current_user, TokenData
from models.study_plan import StudyPlan
from models.content import AnimationCache, UserAnimation
from sqlalchemy import select
import uuid
from datetime import datetime
from langfuse import observe, propagate_attributes

router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
@observe()
async def upload_content(
    plan_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file (PDF) or add a URL (YouTube/Web) to the knowledge base.
    """
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            if not file and not url:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Either file or url must be provided"
                )

            # Check if plan exists
            result = await db.execute(select(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.user_id))
            plan = result.scalars().first()
            if not plan:
                 raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Study plan not found"
                )

            ingestion_result = {}
            resource_entry = {}
            
            if file:
                # Validate file type
                allowed_types = [
                    "application/pdf", 
                    "text/plain",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/msword",
                    "application/json",
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ]
                if file.content_type not in allowed_types and not file.content_type.startswith("image/"):
                     raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unsupported file type: {file.content_type}. Supported: PDF, Word, Text, Images"
                    )
                
                ingestion_result = await content_ingestion_service.process_file(file, plan_id)
                # Create resource entry
                resource_entry = {
                    "id": str(uuid.uuid4()),
                    "title": file.filename,
                    "type": "file",
                    "file_type": file.content_type,
                    "url": ingestion_result.get("type") == "file" and f"/api/static/uploads/{plan_id}/{file.filename}", # Fallback/Verification
                    "verified_url": ingestion_result.get("extra_metadata", {}).get("url"),
                    "added_at": datetime.utcnow().isoformat()
                }
                
            elif url:
                if "youtube.com" in url or "youtu.be" in url:
                    ingestion_result = await content_ingestion_service.process_youtube_url(url, plan_id)
                    resource_entry = {
                        "id": str(uuid.uuid4()),
                        "title": ingestion_result.get("source", "YouTube Video"),
                        "type": "youtube",
                        "url": url,
                        "added_at": datetime.utcnow().isoformat()
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Only YouTube URLs are currently supported"
                    )
            
            # Update plan metadata
            current_metadata = dict(plan.plan_metadata) if plan.plan_metadata else {}
            resources = current_metadata.get("resources", [])
            
            # Use verified URL from ingestion result if available, else fallback
            if ingestion_result.get("extra_metadata", {}).get("url"):
                resource_entry["url"] = ingestion_result["extra_metadata"]["url"]
            
            resources.append(resource_entry)
            current_metadata["resources"] = resources
            
            # Use sqlalchemy.orm.attributes.flag_modified to ensure SQLAlchemy sees the update
            from sqlalchemy.orm.attributes import flag_modified
            plan.plan_metadata = current_metadata
            flag_modified(plan, "plan_metadata")
            
            await db.commit()
            
            return {
                "status": "success",
                "resource": resource_entry,
                "ingestion": ingestion_result
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/visualize")
@observe()
async def visualize_topic(
    topic: str,
    plan_id: Optional[str] = Query(None),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a 2D Motion Graphics animation script for a topic.
    """
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            from agents.orchestrator import orchestrator
            
            exam_type = "General"
            if plan_id:
                # Get study plan context
                result = await db.execute(select(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.user_id))
                plan = result.scalars().first()
                if plan:
                    exam_type = plan.exam_type
            
            # Check global cache first
            cache_result = await db.execute(
                select(AnimationCache).filter(
                    AnimationCache.topic == topic,
                    AnimationCache.exam_type == exam_type
                )
            )
            cached_anim = cache_result.scalars().first()
            
            viz_data = None
            cache_id = None
            
            if cached_anim:
                viz_data = cached_anim.viz_data
                cache_id = cached_anim.id
            else:
                # Generate visualization data via orchestrator
                viz_data = await orchestrator.generate_visualization(topic, exam_type)
                
                # Save to global cache
                new_cache = AnimationCache(
                    topic=topic,
                    exam_type=exam_type,
                    viz_data=viz_data
                )
                db.add(new_cache)
                await db.commit()
                await db.refresh(new_cache)
                cache_id = new_cache.id
                
            # Add to user's personal video library if they don't already have it
            user_anim_result = await db.execute(
                select(UserAnimation).filter(
                    UserAnimation.user_id == current_user.user_id,
                    UserAnimation.animation_id == cache_id
                )
            )
            if not user_anim_result.scalars().first():
                user_record = UserAnimation(
                    user_id=current_user.user_id,
                    animation_id=cache_id,
                    topic=topic
                )
                db.add(user_record)
                await db.commit()
            
            return viz_data
    except Exception as e:
        logger.error(f"Error generating animation visualization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/animations/my")
async def get_my_animations(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's generated animations."""
    try:
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(UserAnimation)
            .options(selectinload(UserAnimation.animation))
            .filter(UserAnimation.user_id == current_user.user_id)
            .order_by(UserAnimation.created_at.desc())
        )
        animations = result.scalars().all()
        
        return [
            {
                "id": str(anim.id),
                "topic": anim.topic,
                "created_at": anim.created_at,
                "viz_data": anim.animation.viz_data
            }
            for anim in animations
        ]
    except Exception as e:
        logger.error(f"Error fetching user animations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/animations/{animation_id}")
async def delete_user_animation(
    animation_id: str,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an animation from the user's personal library."""
    try:
        result = await db.execute(
            select(UserAnimation).filter(
                UserAnimation.id == animation_id,
                UserAnimation.user_id == current_user.user_id
            )
        )
        anim = result.scalars().first()
        
        if not anim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Animation not found or you don't have permission to delete it"
            )
            
        await db.delete(anim)
        await db.commit()
        
        return {"status": "success", "message": "Animation deleted successfully from your library"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting animation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete animation"
        )
