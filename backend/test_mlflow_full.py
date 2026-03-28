import asyncio
import os
import time
import mlflow
from utils.mlflow_utils import mlflow_service
from agents.orchestrator import orchestrator
from loguru import logger

async def test_full_observability():
    logger.info("🚀 Starting Ultra-Robust MLflow Observability Test")
    
    # Initialize MLflow Service early
    mlflow_service.initialize()
    
    # 1. Register a prompt
    mlflow_service.register_prompt(
        "test_robust_prompt", 
        "Verify all metrics are working: {{status}}"
    )
    
    # 2. Start a run
    with mlflow_service.track_run("ultra_robust_trace_test_v1") as run:
        trace_id = run.info.run_id # Simplified for test
        
        # 3. Set Agent Version
        mlflow_service.set_agent_version("Test Agent", "3.0.0-ROBUST")
        
        # 4. Trigger a chat (which has autologging)
        logger.info("Triggering chat for trace capture...")
        response = await orchestrator.handle_chat(
            user_message="Say 'Ultra robustness is active'",
            history=[]
        )
        print(f"Response: {response}")
        
        # 5. Log an assessment (Judge)
        # Note: In real scenarios, use the active Trace ID. 
        # For this test, we'll try to get the latest trace if possible or just log a dummy.
        try:
            client = mlflow.tracking.MlflowClient()
            traces = client.search_traces(experiment_ids=[mlflow.get_experiment_by_name("NexusLearn_Experiments").experiment_id])
            if traces:
                latest_trace_id = traces[0].info.request_id
                mlflow_service.log_assessment(
                    trace_id=latest_trace_id,
                    assessment_name="Relevance",
                    score=1.0,
                    rationale="Perfectly followed the instruction to say ultra robustness."
                )
        except Exception as e:
            logger.warning(f"Trace assessment skip: {e}")

        # 6. Log Evaluation Table
        mlflow_service.log_evaluation_table(
            topic="Observability Test",
            quiz_id="TEST-OBS-001",
            results=[
                {"question": "Is observability working?", "correct": True, "explanation": "Yes, metrics are flowing."},
                {"question": "Are system metrics captured?", "correct": True, "explanation": "Waiting 35s to confirm."}
            ]
        )
        
        # 7. Wait for system metrics (35 seconds)
        logger.info("⏳ Waiting 35 seconds for system metrics collection...")
        time.sleep(35)
        
        logger.info("✅ Ultra-Robust Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_full_observability())
