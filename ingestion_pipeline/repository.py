from dagster import Definitions

from ingestion_pipeline.jobs import ingestion_job
from ingestion_pipeline.ops import (
    read_json_op,
    transform_op,
    load_postgres_op,
    index_elasticsearch_op,
)

defs = Definitions(
    jobs=[ingestion_job],
)
