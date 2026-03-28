"""
Chat API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
import uuid
from datetime import datetime, UTC
from typing import List, Dict, Any, Optional

from langfuse import observe, propagate_attributes

from database.connection import get_db
from models.quiz import ChatSession, ChatRequest, ChatResponse, ChatMessage, ChatSessionResponse
from utils.auth import get_current_user, TokenData
from services.azure_openai import azure_openai_service
from services.vector_store import vector_store_service
from agents.safety_agent import safety_agent
from agents.orchestrator import orchestrator

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
@observe()
async def send_message(
    request: ChatRequest,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a chat message and get AI response."""
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            request_context = jsonable_encoder(request.context or {})

            # Get or create chat session
            chat_session = None
            if request.session_id:
                result = await db.execute(
                    select(ChatSession).where(
                        ChatSession.id == request.session_id,
                        ChatSession.user_id == current_user.user_id
                    )
                )
                chat_session = result.scalar_one_or_none()
            
            if not chat_session:
                # Create new session (optionally using the requested ID if provided)
                chat_session = ChatSession(
                    id=request.session_id if request.session_id else uuid.uuid4(),
                    user_id=current_user.user_id,
                    title=request.message[:50],
                    messages=[],
                    context=request_context
                )
                db.add(chat_session)
                logger.info(f"Created new chat session: {chat_session.id}")
            else:
                # If caller provided context updates, persist them for subsequent turns
                if request_context and isinstance(request_context, dict):
                    chat_session.context = jsonable_encoder({**(chat_session.context or {}), **request_context})
            
            # Add user message
            user_message = ChatMessage(
                role="user",
                content=request.message,
                timestamp=datetime.now(UTC).isoformat()
            )
            chat_session.messages = jsonable_encoder(chat_session.messages) + [jsonable_encoder(user_message.model_dump())]

            # LLM-only Chat: Use context provided in request + session history
            req_ctx = request.context or chat_session.context or {}
            
            # RAG Retrieval
            rag_context = ""
            sources = []
            
            # Check if we have a plan_id in the context to scope the search
            plan_id = req_ctx.get("plan_id") or req_ctx.get("study_plan_id")
            
            if plan_id:
                logger.info(f"Performing RAG search for plan_id: {plan_id} with query: {request.message}")
                try:
                    search_results = await vector_store_service.search(
                        module_id=str(plan_id),
                        query=request.message,
                        top_k=3
                    )
                    
                    if search_results:
                        rag_context = "\n\nRELEVANT KNOWLEDGE BASE CONTENT:\n"
                        for idx, doc in enumerate(search_results):
                            source_name = doc.get("source", "Unknown Source")
                            rag_context += f"--- Source {idx+1}: {source_name} ---\n{doc.get('text', '')}\n"
                            
                            sources.append({
                                "title": source_name,
                                "url": doc.get("url", ""),
                                "type": doc.get("metadata", {}).get("type", "file")
                            })
                        
                        logger.info(f"RAG search found {len(search_results)} documents")
                    else:
                        logger.info("RAG search returned no results")
                except Exception as e:
                    logger.warning(f"RAG search failed: {str(e)}")
                    # Continue without RAG if search fails
            
            # 1. Safety Filter
            is_safe, safety_feedback = await safety_agent.check_query(request.message)
            if not is_safe:
                return ChatResponse(
                    session_id=chat_session.id,
                    message=safety_feedback,
                    role="assistant",
                    timestamp=datetime.now(UTC).isoformat()
                )

            # 2. Collaborative Multi-Agent Response via Orchestrator
            # We pass the full session messages and the RAG context
            history = chat_session.messages[:-1] # Exclude the user message we just added
            
            ai_response = await orchestrator.handle_chat(
                user_message=request.message,
                history=history,
                rag_context=rag_context,
                user_context=req_ctx
            )

            # Add AI message to session
            assistant_message = ChatMessage(
                role="assistant",
                content=ai_response,
                timestamp=datetime.now(UTC).isoformat()
            )
            chat_session.messages = jsonable_encoder(chat_session.messages) + [jsonable_encoder(assistant_message.model_dump())]
            
            await db.commit()
            
            return ChatResponse(
                session_id=chat_session.id,
                message=ai_response,
                role="assistant",
                timestamp=assistant_message.timestamp,
                sources=sources
            )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate chat response"
        )


@router.get("/history", response_model=List[ChatSessionResponse])
@observe()
async def get_chat_history(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all chat sessions for current user."""
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            result = await db.execute(
                select(ChatSession)
                .where(ChatSession.user_id == current_user.user_id)
                .order_by(ChatSession.updated_at.desc())
            )
            return result.scalars().all()
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat history"
        )


@router.get("/session/{session_id}", response_model=ChatSessionResponse)
@observe()
async def get_chat_session(
    session_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific chat session with messages."""
    try:
        with propagate_attributes(user_id=str(current_user.user_id)):
            result = await db.execute(
                select(ChatSession).where(
                    ChatSession.id == session_id,
                    ChatSession.user_id == current_user.user_id
                )
            )
            session = result.scalar_one_or_none()
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
            return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch chat session"
        )


@router.delete("/session/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(
    session_id: uuid.UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session."""
    try:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id,
                ChatSession.user_id == current_user.user_id
            )
        )
        chat_session = result.scalar_one_or_none()
        
        if not chat_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        await db.delete(chat_session)
        await db.commit()
        
        logger.info(f"Chat session deleted: {session_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat session"
        )
