"""
Celery application for background tasks (e.g. Test Center question generation).
"""

from celery import Celery
from config import get_settings

settings = get_settings()

app = Celery(
    "nexus_learn",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["tasks.quiz_tasks"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=120,
    task_soft_time_limit=110,
    worker_prefetch_multiplier=1,
)
