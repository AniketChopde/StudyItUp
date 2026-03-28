
import mlflow
import mlflow.openai
import os
import time
from contextlib import contextmanager
from functools import wraps
from typing import Any, Optional, Dict, Union, List
from loguru import logger
from config import settings

class MLFlowService:
    def __init__(self, experiment_name: str = "NexusLearn_Experiments"):
        self.experiment_name = experiment_name
        self.tracking_uri = "sqlite:///mlflow.db"
        self._initialized = False

    def initialize(self):
        """Public method to ensure MLflow is initialized."""
        self._ensure_mlflow()

    def _ensure_mlflow(self):
        if self._initialized:
            return
        
        import mlflow
        mlflow.set_tracking_uri(self.tracking_uri)
        mlflow.set_experiment(self.experiment_name)
        
        # New for MLflow 3.x: Enable deep GenAI tracing
        # This is often done globally, but we do it on demand here.
        
        # Enable OpenAI autologging for GenAI traces
        try:
            import mlflow
            import mlflow.openai
            mlflow.openai.autolog(
                log_traces=True,
                log_models=True,
                log_outermost_only=False,
                extra_tags={
                    "app_version": settings.app_version,
                    "model_provider": "Azure OpenAI",
                    "tracking_layer": "MLFlowService"
                }
            )
            logger.info("✅ MLflow OpenAI autologging initialized")
        except Exception as e:
            logger.error(f"Failed to initialize MLflow OpenAI autologging: {e}")

        # Enable Langchain autologging for additional traces
        try:
            import mlflow
            import mlflow.langchain
            mlflow.langchain.autolog(
                log_traces=True,
                log_models=True
            )
            logger.info("✅ MLflow Langchain autologging initialized")
        except Exception as e:
            logger.error(f"Failed to initialize MLflow Langchain autologging: {e}")

        # Enable system metrics logging (CPU, RAM, etc.) if psutil is available
        try:
            import psutil
            import mlflow
            # Ensure high-frequency sampling for short-lived agent runs
            os.environ["MLFLOW_SYSTEM_METRICS_SAMPLING_INTERVAL"] = "1"
            mlflow.enable_system_metrics_logging()
            logger.info("✅ MLflow system metrics logging enabled (1s interval)")
        except ImportError:
            logger.warning("psutil not installed, system metrics will not be logged")
        except Exception as e:
            logger.debug(f"System metrics logging skip: {e}")
        
        self._initialized = True

    def log_run(self, run_name: str, parameters: Dict[str, Any] = None, metrics: Dict[str, Any] = None, tags: Dict[str, str] = None):
        """
        Log a generic run to MLflow.
        """
        self._ensure_mlflow()
        import mlflow
        with mlflow.start_run(run_name=run_name):
            if parameters:
                mlflow.log_params(parameters)
            if metrics:
                mlflow.log_metrics(metrics)
            if tags:
                mlflow.set_tags(tags)

    def log_quiz_score(self, user_id: str, quiz_id: str, topic: str, score: float):
        """
        Log quiz score as a metric.
        Logs to the active run if one exists, otherwise creates a new one.
        """
        self._ensure_mlflow()
        import mlflow
        active_run = mlflow.active_run()
        if active_run:
            logger.info(f"Logging quiz-score to active run: {active_run.info.run_id}")
            mlflow.log_params({
                "user_id": user_id,
                "quiz_id": quiz_id,
                "topic": topic
            })
            mlflow.log_metric("quiz-score", score)
            mlflow.set_tag("type", "evaluation")
            # Wait for system metrics sample
            import time
            time.sleep(3)
        else:
            with mlflow.start_run(run_name=f"quiz_score_{topic}"):
                mlflow.log_params({
                    "user_id": user_id,
                    "quiz_id": quiz_id,
                    "topic": topic
                })
                mlflow.log_metric("quiz-score", score)
                mlflow.set_tag("type", "evaluation")
                # Wait for system metrics sample
                import time
                time.sleep(3)

    def log_evaluation_table(self, topic: str, results: List[Dict[str, Any]], user_id: str = "anonymous", quiz_id: str = None):
        """
        Log detailed evaluation results as a table.
        """
        self._ensure_mlflow()
        import mlflow
        try:
            active_run = mlflow.active_run()
            run_id = active_run.info.run_id if active_run else None
            
            # Format results for MLflow table
            data = []
            for res in results:
                data.append({
                    "question": res.get("question", ""),
                    "user_answer": res.get("user_answer", ""),
                    "correct_answer": res.get("correct_answer", ""),
                    "is_correct": res.get("is_correct", False),
                    "feedback": res.get("feedback", "")
                })
            
            try:
                import pandas as pd
                df = pd.DataFrame(data)
                
                if run_id:
                    mlflow.log_table(data=df, artifact_file=f"eval_{int(time.time())}.json")
                    logger.info(f"Logged evaluation table to run: {run_id}")
                else:
                    with mlflow.start_run(run_name=f"eval_{topic}"):
                        mlflow.log_table(data=df, artifact_file=f"eval_{int(time.time())}.json")
                        mlflow.set_tag("type", "evaluation_table")
                        logger.info("Logged evaluation table to NEW run")
            except ImportError:
                logger.warning("Pandas not installed. Falling back to simple JSON artifact for evaluation table.")
                if run_id:
                    mlflow.log_dict(data, f"eval_{int(time.time())}.json")
                else:
                    with mlflow.start_run(run_name=f"eval_{topic}"):
                        mlflow.log_dict(data, f"eval_{int(time.time())}.json")
        except Exception as e:
            logger.error(f"Failed to log evaluation table: {e}")

    def register_prompt(self, name: str, prompt_template: str):
        """
        Register a prompt template in MLflow.
        """
        self._ensure_mlflow()
        try:
            import mlflow.genai
            mlflow.genai.register_prompt(name=name, template=prompt_template)
            logger.info(f"✅ Registered prompt: {name}")
        except Exception as e:
            logger.error(f"Failed to register prompt: {e}")

    def log_assessment(self, trace_id: str, assessment_name: str, score: float, rationale: str = ""):
        """
        Log an assessment for a trace (Judge).
        """
        self._ensure_mlflow()
        try:
            import mlflow
            client = mlflow.tracking.MlflowClient()
            # client.log_assessment is the standard in MLflow 2.11+ / 3.x
            client.log_assessment(
                trace_id=trace_id,
                name=assessment_name,
                score=score,
                rationale=rationale
            )
            logger.info(f"✅ Logged assessment '{assessment_name}' for trace {trace_id}")
        except Exception as e:
            logger.debug(f"Assessment logging skip: {e}")

    def set_active_agent(self, name: str):
        """
        Set the active agent model in MLflow 3.x.
        This populates the 'Agent versions' tab.
        """
        self._ensure_mlflow()
        try:
            import mlflow
            # This links all subsequent traces/evals to this 'LoggedModel'
            mlflow.set_active_model(name)
            logger.info(f"✅ Set active agent model: {name}")
        except Exception as e:
            logger.debug(f"Set active model skip: {e}")

    def set_agent_version(self, agent_name: str, version: str):
        """
        Set agent version as a tag on the active run AND active trace.
        """
        self._ensure_mlflow()
        try:
            import mlflow
            # 1. Set tag on active run
            active_run = mlflow.active_run()
            if active_run:
                mlflow.set_tag(f"agent.{agent_name}.version", version)
                mlflow.set_tag("agent_version", version)
            
            # 2. Set tag on active trace if available (MLflow 3.x)
            try:
                # Update current trace tags for 'Agent versions' tab linking
                mlflow.update_current_trace(
                    tags={
                        "mlflow.agent.name": agent_name,
                        "mlflow.agent.version": version
                    }
                )
            except Exception:
                pass
        except Exception:
            pass

    @contextmanager
    def track_run(self, run_name: str, tags: Dict[str, str] = None, nested: bool = True):
        """
        Context manager to track a run with detailed logging capabilities.
        Suports nested runs automatically.
        """
        self._ensure_mlflow()
        import mlflow
        # nested=True allows this run to be created even if another run is active
        with mlflow.start_run(run_name=run_name, nested=nested) as run:
            if tags:
                mlflow.set_tags(tags)
            
            start_time = time.time()
            status = "success"
            
            try:
                yield run
            except Exception as e:
                status = "failed"
                mlflow.log_param("error_type", type(e).__name__)
                mlflow.log_param("error_message", str(e))
                raise e
            finally:
                duration = time.time() - start_time
                mlflow.log_metric("latency_seconds", duration)
                mlflow.log_param("status", status)

    def track_latency(self, run_name_prefix: str):
        """
        Decorator to track execution time of a function.
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Ensure nested=True is used here as well
                with self.track_run(f"{run_name_prefix}_{func.__name__}", nested=True):
                     # Try to capture relevant inputs if possible (simplified)
                    if kwargs.get('plan_request'):
                        mlflow.log_param("exam_type", getattr(kwargs['plan_request'], 'exam_type', 'unknown'))
                    return await func(*args, **kwargs)
            return wrapper
        return decorator

mlflow_service = MLFlowService()
