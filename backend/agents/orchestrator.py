"""
Orchestrator Agent for coordinating complex workflows across specialized agents.
"""

import asyncio
import mlflow
from typing import List, Dict, Any
from loguru import logger
from datetime import datetime, timedelta

from agents.search_agent import search_agent
from agents.planning_agent import planning_agent
from agents.content_agent import content_agent
from agents.quiz_agent import quiz_agent
from agents.gap_analysis_agent import gap_analysis_agent
from agents.content_filter_agent import content_filter_agent
from services.azure_openai import azure_openai_service
from services.vector_store import vector_store_service
from services.image_service import image_service
from agents.safety_agent import safety_agent
from utils.mlflow_utils import mlflow_service
from sqlalchemy.ext.asyncio import AsyncSession

class AgentOrchestrator:
    """Agent responsible for multi-agent coordination."""
    
    def __init__(self):
        """Initialize Orchestrator."""
        self.agent_name = "Orchestrator Agent"
        self.version = "1.2.0"
        
        # Register core prompts in MLflow for visibility
        mlflow_service.register_prompt(
            name="orchestrator_chat_v1",
            prompt_template="""You are a helpful, professional educational assistant for NexusLearn.
            
            Use the provided RELEVANT KNOWLEDGE BASE CONTENT (if any) to ground your answers.
            If context is provided, prioritize it. If not, use your internal knowledge.
            
            Keep responses concise, educational, and encouraging.
            Use Markdown for formatting and Mermaid for diagrams if helpful."""
        )
        
        # Set this as the active agent model for MLflow 3.x 'Agent versions' tab
        mlflow_service.set_active_agent(self.agent_name)
    
    @mlflow_service.track_latency("exam_prep_workflow")
    @mlflow.trace(name="Handle Exam Preparation")
    async def handle_exam_preparation(
        self,
        exam_type: str,
        target_date: str,
        daily_hours: int,
        user_goal: str = None,
        current_knowledge: Dict[str, Any] = None,
        fast_learn: bool = False,
        language: str = "English"
    ) -> Dict[str, Any]:
        """
        Create a study plan for any learning goal (exam, skill, or subject).
        """
        try:
            logger.info(f"Starting study plan workflow for {exam_type} (Fast Learn: {fast_learn})")
            
            # Step 1: Skip internet search for syllabus as per user request (User wants LLM-only)
            logger.info("Step 1: Using LLM internal knowledge for syllabus (Internet search skipped)...")
            exam_info = {} # We'll let planning agent use its knowledge
            
            # Step 2: Analyze goal and feasibility
            logger.info("Step 2: Analyzing user goal...")
            goal_analysis = await planning_agent.analyze_user_goal(
                goal=user_goal or f"Learn {exam_type} by {target_date} with {daily_hours} hours daily",
                exam_type=exam_type,
                target_date=target_date,
                daily_hours=daily_hours,
                current_knowledge=current_knowledge or {}
            )
            
            # Step 3: Create study plan
            logger.info(f"Step 3: Creating study plan in {language}...")
            study_plan = await planning_agent.create_study_plan(
                exam_type=exam_type,
                target_date=target_date,
                daily_hours=daily_hours,
                syllabus_data=None, # Explicitly None to use LLM knowledge only
                current_knowledge=current_knowledge or {},
                goal=user_goal,
                fast_learn=fast_learn,
                language=language
            )
            
            # Step 4: Generate immediate actions
            logger.info("Step 4: Generating immediate actions...")
            immediate_actions = await planning_agent.get_immediate_actions(
                study_plan=study_plan
            )
            
            result = {
                "exam_info": exam_info,
                "goal_analysis": goal_analysis,
                "study_plan": study_plan,
                "immediate_actions": immediate_actions,
                "created_at": datetime.utcnow().isoformat()
            }
            
            logger.info("Study plan workflow completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in handle_exam_preparation: {str(e)}")
            raise
    
    async def ensure_topic_indexed(
        self,
        module_id: str,
        topic: str,
        exam_type: str,
        module_name: str,
    ) -> bool:
        """Ensures a topic is indexed, fetching and processing content if needed."""
        if vector_store_service.get_context_length(module_id) > 0:
            logger.info(f"Topic '{topic}' is already indexed for module '{module_id}'.")
            return True

        try:
            # Check if already indexed
            if vector_store_service.get_context_length(module_id) > 20:
                logger.info(f"Topic '{topic}' already indexed with {vector_store_service.get_context_length(module_id)} chunks, skipping re-index")
                return True

            logger.info(f"Auto-indexing topic: '{topic}' for module: {module_id}")
            raw_resources = await search_agent.research_module_content(module_name, topic)
            if not raw_resources:
                logger.warning(f"No raw resources found for topic: {topic}")
                return False

            clean_docs = await content_filter_agent.filter_and_format(
                exam_type, module_name, topic, raw_resources
            )
            if not clean_docs:
                logger.warning(f"No clean documents produced for topic: {topic}")
                return False

            await vector_store_service.add_documents(module_id, clean_docs)
            logger.info(f"Successfully auto-indexed topic: '{topic}'")
            return True
        except Exception as e:
            logger.error(f"Error during auto-indexing for topic '{topic}': {e}")
            return False

    @mlflow.trace(name="Handle Topic Learning")
    async def handle_topic_learning(
        self,
        module_id: str,
        topic: str,
        exam_type: str = "General",
        module_name: str = "Specific Module"
    ) -> Dict[str, Any]:
        """
        Complete topic learning workflow with RAG pipeline.
        """
        try:
            logger.info(f"Starting RAG-based learning flow for: {topic}")
            
            # Ensure topic is indexed before proceeding
            await self.ensure_topic_indexed(
                module_id=module_id,
                topic=topic,
                exam_type=exam_type,
                module_name=module_name,
            )

            # Step 4: Teaching Agent (Grounded Explanation)
            logger.info("Step 4: Teaching Agent generating explanation...")
            explanation = await content_agent.explain_concept(
                module_id=module_id,
                topic=topic,
                module_name=module_name
            )
            
            # Step 5: Quiz Agent (Grounded Quiz)
            logger.info("Step 5: Quiz Agent creating assessment...")
            quiz_questions = await quiz_agent.generate_questions(
                module_id=module_id,
                topic=topic,
                count=5,
                exam_type=exam_type
            )
            
            # Use explanation as base and update with meta info (Flattening structure for Frontend)
            result = explanation
            result.update({
                "quiz": quiz_questions,
                "source_grounded": True,
                "created_at": datetime.utcnow().isoformat()
            })
            # Ensure topic is strictly set from the loop variable
            result["topic"] = topic
            
            logger.info("RAG learning workflow completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in handle_topic_learning: {str(e)}")
            raise

    
    async def handle_performance_review(
        self,
        user_id: str,
        quiz_results: list,
        progress_data: list
    ) -> Dict[str, Any]:
        """
        Complete performance review workflow.
        """
        try:
            logger.info(f"Starting performance review for user: {user_id}")
            
            # Step 1: Analyze performance
            logger.info("Step 1: Analyzing performance...")
            performance_analysis = await gap_analysis_agent.analyze_performance(
                quiz_results=quiz_results,
                user_id=user_id
            )
            
            # Step 2: Identify weak areas
            logger.info("Step 2: Identifying weak areas...")
            user_history = {
                "quiz_results": quiz_results,
                "progress": progress_data
            }
            weak_areas = await gap_analysis_agent.identify_weak_areas(user_history)
            
            # Step 3: Generate focus recommendations
            logger.info("Step 3: Generating recommendations...")
            focus_plan = await gap_analysis_agent.suggest_focus_areas(
                gaps=weak_areas,
                time_available_hours=10
            )
            
            # Step 4: Create personalized guidance
            logger.info("Step 4: Creating personalized guidance...")
            weak_topics = [area.get("topic") for area in weak_areas[:5]]
            guidance = await gap_analysis_agent.generate_personalized_guidance(
                weak_areas=weak_topics,
                learning_style="visual"
            )
            
            result = {
                "performance_analysis": performance_analysis,
                "weak_areas": weak_areas,
                "focus_plan": focus_plan,
                "personalized_guidance": guidance,
                "created_at": datetime.utcnow().isoformat()
            }
            
            logger.info("Performance review completed successfully")
            return result
        
        except Exception as e:
            logger.error(f"Error in handle_performance_review: {str(e)}")
            raise

    async def handle_chapter_teaching(
        self,
        chapter_id: str,
        chapter_name: str,
        topics: List[str],
        db: AsyncSession,
        exam_type: str = "General",
        enable_rag: bool = False, # RAG is now optional for speed
        language: str = "English"
    ) -> Dict[str, Any]:
        """
        Optimized chapter teaching workflow - generates ONLY teaching content.
        Quiz generation is moved to separate endpoint for better performance.
        
        Performance: ~30s vs 5min (10x faster)
        """
        try:
            logger.info(f"🚀 Starting OPTIMIZED teaching workflow for: {chapter_name} (RAG={enable_rag})")
            
            # Generate teaching content for all topics in parallel
            # WITHOUT quiz generation and WITHOUT RAG (unless explicitly requested)
            async def generate_topic_explanation(topic: str):
                """Generate explanation for a single topic."""
                # Cache lookup
                cache_key = f"{topic}|{exam_type}|{language}|rag:{enable_rag}"
                from services.cache import cache_service
                cached_data = await cache_service.db_get(db, "explanation", cache_key)
                if cached_data and cached_data.get("main_explanation"):
                    cached_data["cache_hit"] = True
                    return cached_data

                module_id = f"{chapter_id}_{topic.replace(' ', '_')}"
                
                # Optional: Do RAG only if enabled
                if enable_rag:
                    logger.info(f"🔍 RAG enabled for: {topic}")
                    await self.ensure_topic_indexed(
                        module_id=module_id,
                        topic=topic,
                        exam_type=exam_type,
                        module_name=chapter_name
                    )
                    # Generate grounded explanation
                    explanation = await content_agent.explain_concept(
                        module_id=module_id,
                        topic=topic,
                        module_name=chapter_name
                    )
                else:
                    # Fast path: Direct LLM explanation without RAG
                    logger.info(f"⚡ Fast explanation (no RAG) for: {topic}")
                    explanation = await content_agent.explain_concept_fast(
                        topic=topic,
                        exam_type=exam_type,
                        context=chapter_name
                    )
                
                
                # Return complete explanation with all fields
                result = explanation
                result.update({
                    "topic": topic,
                    "source_grounded": enable_rag,
                    "created_at": datetime.utcnow().isoformat()
                })
                
                # Save to cache
                result["cache_hit"] = False
                await cache_service.db_set(db, "explanation", cache_key, result)
                
                return result
            
            # Execute all topics in parallel
            tasks = [generate_topic_explanation(topic) for topic in topics]
            topic_lessons = await asyncio.gather(*tasks)
            
            logger.info(f"✅ Teaching content generated for {len(topics)} topics in chapter '{chapter_name}'")
                
            return {
                "chapter_name": chapter_name,
                "topic_lessons": topic_lessons,
                "teaching_completed_at": datetime.utcnow().isoformat(),
                "source_grounded": enable_rag,
                "quiz_note": "Quiz generation moved to separate endpoint - click 'Generate Quiz' button"
            }
            
        except Exception as e:
            logger.error(f"❌ Error in handle_chapter_teaching: {str(e)}")
            raise

    @mlflow_service.track_latency("chat_handler")
    @mlflow.trace(name="Handle Chat")
    async def handle_chat(
        self,
        user_message: str,
        history: List[Dict[str, Any]],
        rag_context: str = "",
        user_context: Dict[str, Any] = None
    ) -> str:
        """
        Unified chat handler coordinating RAG and model memory.
        """
        try:
            # Set agent version on the active run for tracking
            mlflow_service.set_agent_version(self.agent_name, self.version)
            
            logger.info(f"Orchestrator handling chat: {user_message[:50]}...")
            
            system_prompt = """You are a helpful, professional educational assistant for NexusLearn.
            
            Use the provided RELEVANT KNOWLEDGE BASE CONTENT (if any) to ground your answers.
            If context is provided, prioritize it. If not, use your internal knowledge.
            
            Keep responses concise, educational, and encouraging.
            Use Markdown for formatting and Mermaid for diagrams if helpful.
            """
            
            # Record prompt use in MLflow
            mlflow_service.register_prompt("orchestrator_chat_v1", system_prompt)
            
            # Format history for OpenAI
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add history
            for msg in history[-10:]: # Last 10 messages for context
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Add RAG context and current question
            user_content = f"{rag_context}\n\nUSER QUESTION: {user_message}"
            messages.append({"role": "user", "content": user_content})
            
            response = await azure_openai_service.chat_completion(
                messages=messages,
                temperature=1.0
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error in Orchestrator handle_chat: {str(e)}")
            return "I apologize, but I encountered an error while processing your request. Please try again or ask a different question."

    @mlflow.trace(name="Generate Motion Graphics Script")
    async def generate_visualization(
        self,
        topic: str,
        exam_type: str = "General"
    ) -> Dict[str, Any]:
        """
        Generates 2D Motion Graphics script for educational animation.
        """
        try:
            logger.info(f"Generating Illustration Animation script for: {topic}")
            
            system_prompt = f"""You are TOP educational animation director. Create a rich animated explainer for "{topic}" ({exam_type} level).

CRITICAL: Each stage MUST have a COMPLETELY DIFFERENT visual layout. Never repeat the same arrangement.

=== ELEMENT TYPES ===
- "text": Title/caption text. Fields: label, font_size (sm/md/lg/xl/2xl/3xl), font_weight, animation (typewriter/fade)
- "box": Concept card with big icon. Fields: label, sublabel, icon_name, color
- "circle": Bubble node for key terms. Fields: label, color  
- "connector": Arrow between elements. Fields: label, from_id, to_id, arrow_style (solid/dashed), color
- "stick_figure": Teacher character. Fields: label, pose (standing/thinking/pointing/teaching), color

=== ICON_NAME OPTIONS ===
brain, lightbulb, cpu, globe, zap, atom, book, star, rocket, check, target, trend, users, chat, flask, wifi, cloud, lock, search, chart, pie, award, help, refresh, db, server, layers, code, git, workflow, molecule, leaf, eye, heart, arrow, binary, pulse, battery, circuit

=== 5 DIFFERENT LAYOUT TEMPLATES — use a DIFFERENT one per stage ===

LAYOUT A — "Hero Center" (Introduction)
- Title [50,8] size [75,9]  
- Big centered box card [50,40] size [38,30] — main concept with icon
- 2 circle bubbles [22,72] and [78,72] size [16,12] — key terms
- Caption [50,88] size [65,6]

LAYOUT B — "Side by Side Compare" (Comparison)  
- Title [50,8] size [75,9]
- Left box card [28,42] size [32,30] — concept A with icon
- Right box card [72,42] size [32,30] — concept B with icon
- Connector between them with label (e.g. "vs")
- Caption [50,82] size [65,6]

LAYOUT C — "3-Column Grid" (Types/Categories)
- Title [50,8] size [75,9]
- Box card 1 [20,42] size [24,30] — type 1
- Box card 2 [50,42] size [24,30] — type 2  
- Box card 3 [80,42] size [24,30] — type 3
- Caption [50,82] size [65,6]

LAYOUT D — "Flow Diagram" (Process/Steps)
- Title [50,8] size [75,9]
- Step 1 box [18,40] size [24,25]
- Connector arrow → with label
- Step 2 box [50,40] size [24,25]
- Connector arrow → with label
- Step 3 box [82,40] size [24,25]
- Caption [50,75] size [60,6]

LAYOUT E — "Hub & Spoke" (Summary/Recap)
- Title [50,8] size [75,9]
- Central large box card [50,42] size [35,30] — main takeaway with icon
- 4 circles around it [20,25] [80,25] [22,68] [78,68] size [16,12]
- Connectors from center to each circle with 1-word labels
- Caption [50,88] size [65,6]

=== OUTPUT FORMAT ===
Output ONLY valid JSON. No markdown fences.

{{
  "theme": "whiteboard",
  "title": "{topic}",
  "stages": [
    {{
      "step": 1,
      "layout": "hero_center",
      "narration": "2-3 engaging sentences explaining this concept like a friendly teacher. Use analogies.",
      "duration": 14,
      "elements": [
        {{
          "id": "s1-title",
          "type": "text",
          "label": "What Is [Topic]?",
          "position": [50, 8],
          "size": [75, 9],
          "color": "#1E293B",
          "font_size": "3xl",
          "font_weight": "bold",
          "animation": "typewriter",
          "delay": 0
        }},
        {{
          "id": "s1-hero",
          "type": "box",
          "label": "Main concept name",
          "sublabel": "Short description",
          "icon_name": "brain",
          "color": "#6366F1",
          "position": [50, 40],
          "size": [38, 30],
          "delay": 0.8
        }},
        {{
          "id": "s1-bubble1",
          "type": "circle",
          "label": "Key Term 1",
          "position": [22, 72],
          "size": [16, 12],
          "color": "#10B981",
          "delay": 2.0
        }},
        {{
          "id": "s1-bubble2",
          "type": "circle",
          "label": "Key Term 2",
          "position": [78, 72],
          "size": [16, 12],
          "color": "#F97316",
          "delay": 2.6
        }},
        {{
          "id": "s1-caption",
          "type": "text",
          "label": "One-line summary caption",
          "position": [50, 88],
          "size": [65, 6],
          "color": "#64748B",
          "font_size": "sm",
          "animation": "fade",
          "delay": 3.2
        }}
      ]
    }}
  ]
}}

=== RULES ===
1. UNIQUE LAYOUTS: Each stage MUST use a different layout (A through E). NEVER repeat.
2. EVERY box/icon card MUST have: label, sublabel, icon_name, color. Choose relevant icon_name from the list above.
3. RICH NARRATIONS: 2-3 sentences that teach, using analogies and examples.
4. COLOR VARIETY: Use different colors per card: "#6366F1", "#10B981", "#F97316", "#A855F7", "#EF4444", "#0891B2"
5. STAGGER DELAYS: 0, 0.8, 1.6, 2.4, 3.2, 3.8 — every element has different delay.
6. SAFE POSITIONS: x: 8-92, y: 5-88. NEVER position elements below y=88.
7. 5 STAGES exactly. Each teaches a different aspect of the topic.
8. Connectors MUST have short labels (1-2 words).
9. Caption text MUST be at y=82-88, NEVER overlap with cards above.

Generate COMPLETE 5-stage JSON for "{topic}".
"""
            
            user_prompt = f"Topic: {topic}\nLevel: {exam_type}\n\nOutput ONLY raw JSON, no markdown."

            
            response = await azure_openai_service.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=1
            )
            
            from utils.helpers import parse_json_markdown
            motion_data = parse_json_markdown(response)
            
            if not motion_data or "stages" not in motion_data or len(motion_data.get("stages", [])) == 0:
                 logger.warning(f"Failed to generate motion script for {topic}, returning fallback stage.")
                 return {
                     "theme": "whiteboard",
                     "title": topic,
                     "stages": [
                         {
                             "step": 1,
                             "narration": f"Let me prepare the whiteboard explanation for {topic}. One moment please!",
                             "duration": 10,
                             "elements": [
                                 {
                                     "id": "loading-title",
                                     "type": "text",
                                     "label": topic,
                                     "position": [50, 40],
                                     "size": [70, 12],
                                     "color": "#1A1A2E",
                                     "font_size": "3xl",
                                     "font_weight": "bold",
                                     "animation": "typewriter",
                                     "delay": 0
                                 },
                                 {
                                     "id": "loading-fig",
                                     "type": "stick_figure",
                                     "label": "Teacher",
                                     "pose": "thinking",
                                     "position": [50, 68],
                                     "size": [16, 30],
                                     "color": "#1565C0",
                                     "animation": "fade",
                                     "delay": 0.5
                                 }
                             ]
                         }
                     ]
                 }
            
            # Post-Process: Sanitize all elements
            logger.info(f"Post-processing {len(motion_data.get('stages', []))} stages...")
            for stage in motion_data.get("stages", []):
                for element in stage.get("elements", []):
                    # Convert any remaining 'image' elements to box cards (image service is unreliable)
                    if element.get("type") == "image":
                        element["type"] = "box"
                        if not element.get("icon_name"):
                            element["icon_name"] = "lightbulb"
                        if not element.get("sublabel"):
                            element["sublabel"] = element.get("visual_prompt", "Key concept")[:50]
                        if not element.get("color"):
                            element["color"] = "#6366F1"
                    
                    # Ensure box/icon elements have required fields
                    if element.get("type") in ("box", "icon"):
                        if not element.get("icon_name"):
                            element["icon_name"] = "lightbulb"
                        if not element.get("sublabel"):
                            element["sublabel"] = ""
                        if not element.get("color"):
                            element["color"] = "#6366F1"
                    
                    # Ensure every element has a label
                    if not element.get("label") or not str(element["label"]).strip():
                        eid = element.get("id", "item")
                        element["label"] = eid.replace("-", " ").replace("_", " ").title()
                    
                    # Clamp positions to safe canvas area
                    pos = element.get("position", [50, 50])
                    if isinstance(pos, list) and len(pos) >= 2:
                        pos[0] = max(8, min(92, pos[0]))
                        pos[1] = max(5, min(88, pos[1]))
                        element["position"] = pos
            
            logger.info(f"Successfully generated animation for {topic} with {len(motion_data.get('stages', []))} stages.")

            return motion_data
            
        except Exception as e:
            logger.error(f"Error in generate_visualization: {str(e)}")
            raise

# Global orchestrator instance
orchestrator = AgentOrchestrator()
