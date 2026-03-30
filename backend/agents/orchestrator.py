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
            logger.info(f"Generating 2D Motion Graphics script for: {topic}")
            
            system_prompt = f"""You are a Manim Animation Director (inspired by 3Blue1Brown).
            Your goal is to script a premium dark-background educational animation that explains "{topic}" for {exam_type} level.
            
            IMPORTANT: This is NOT a whiteboard style. It is a sleek, dark-background (like 3Blue1Brown) animation.
            
            STRICT JSON FORMAT:
            {{
              "theme": "manim",
              "title": "string",
              "description": "string",
              "total_duration": number,
              "stages": [
                {{
                  "step": number,
                  "duration": number,
                  "narration": "Full educational explanation for TTS",
                  "caption": "Short subtitle text shown on screen",
                  "background_color": "#1a1a4e",
                  "elements": [
                    {{
                      "id": "unique-string",
                      "type": "text | code | math | box | circle | arrow | highlight-box | icon | connector",
                      "label": "string",
                      "position": [x, y],
                      "size": [w, h],
                      "color": "#58C4DD",
                      "animation": "fade | typewriter | draw-line | glow-in | write | pop | slide-in",
                      "delay": 0,
                      "font_size": "sm | md | lg | xl | 2xl | 3xl",
                      "font_weight": "normal | bold | black",
                      "code_content": "for code type: actual code string",
                      "language": "python",
                      "math_expression": "for math type: LaTeX string like E = mc^2",
                      "from_id": "for connector type: source element id",
                      "to_id": "for connector type: target element id",
                      "arrow_style": "solid | dashed | dotted",
                      "highlight_color": "#58C4DD",
                      "icon_name": "atom|brain|globe|zap|lightbulb|cpu|binary|workflow"
                    }}
                  ]
                }}
              ]
            }}
            
            MANIM DIRECTOR RULES:
            1. USE THE DARK AESTHETIC: All colors should be vibrant against dark background.
            2. MANIM COLOR PALETTE:
               - Blue: #58C4DD (primary, explanations)
               - Yellow: #FFFF00 (highlights, important)
               - Green: #83C167 (success, code strings)
               - Red: #FC6255 (warnings, emphasis)
               - Purple: #9A72AC (accents)
               - White: #FFFFFF (main text)
               - Orange: #FF862F (numbers, data)
            3. ELEMENT TYPES TO USE:
               - 'text' with 'typewriter' animation for titles and key phrases
               - 'code' for showing algorithms, formulas in code form
               - 'math' with LaTeX for equations (e.g., "E = mc^2", "\\\\frac{{a}}{{b}}")
               - 'box' for concept containers with neon borders
               - 'arrow' for showing direction/flow
               - 'connector' with from_id/to_id for linking related elements
               - 'highlight-box' for emphasizing key points with pulsing glow
               - 'icon' for visual metaphors
            4. SIZES - VERY IMPORTANT: Keep elements COMPACT to fit the screen.
               - Text titles: size [60, 8] max
               - Text labels: size [40, 6] max
               - Boxes: size [45, 15] max. NEVER wider than 50.
               - Icons: size [12, 15] max
               - Code blocks: size [55, 35] max
               - Math: size [40, 10] max
               - Arrows: size [20, 4]
            5. POSITIONING: Use the FULL canvas. Spread elements across the space.
               - Title text: [50, 12] (top center)
               - Main content: [50, 45] (center)
               - Supporting elements: [25, 50] and [75, 50] (left and right)
               - Bottom items: [50, 80]
               - AVOID stacking everything at [50, 50]
            6. ANIMATION DELAYS: Stagger elements using 'delay' (0, 0.3, 0.6, 0.9...) for sequential reveal.
            7. AVOID IMAGES: Prefer geometric shapes, text, and code over photographs.
            8. EACH STAGE: Must have 3-6 elements that build on each other visually.
            9. STAGE PROGRESSION: Each new stage should feel like a new "scene" in the animation.
            """
            
            user_prompt = f"Topic: {topic}\nLevel: {exam_type}\n\nCreate a complete Manim-style animation script with 4-6 stages."
            
            response = await azure_openai_service.generate_structured_output(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=1
            )
            
            from utils.helpers import parse_json_markdown
            motion_data = parse_json_markdown(response)
            
            if not motion_data or "stages" not in motion_data:
                 logger.warning(f"Failed to generate motion script for {topic}, returning minimal struct.")
                 return {
                     "theme": "manim",
                     "title": topic,
                     "description": "Could not generate motion script.",
                     "stages": []
                 }
            
            # Post-Process: Generate Images for 'image' type elements (rare in Manim style)
            logger.info(f"Post-processing {len(motion_data.get('stages', []))} stages...")
            for stage in motion_data.get("stages", []):
                for element in stage.get("elements", []):
                    if element.get("type") == "image" and element.get("visual_prompt"):
                        try:
                            img_url = await image_service.generate_illustration(
                                prompt=element["visual_prompt"],
                                topic=topic
                            )
                            element["image_url"] = img_url
                        except Exception as e:
                            logger.error(f"Failed to generate image for element {element.get('id')}: {e}")
                            element["type"] = "icon"
            
            logger.info(f"Successfully generated Manim-style motion script for {topic} with {len(motion_data.get('stages', []))} stages.")
            return motion_data
            
        except Exception as e:
            logger.error(f"Error in generate_visualization: {str(e)}")
            raise

# Global orchestrator instance
orchestrator = AgentOrchestrator()
