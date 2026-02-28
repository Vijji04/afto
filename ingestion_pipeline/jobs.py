from dagster import job

from ingestion_pipeline.ops import (
    read_json_op,
    transform_op,
    load_postgres_op,
    index_elasticsearch_op,
)


@job
def ingestion_job():
    products = read_json_op()
    transformed = transform_op(products)
    load_postgres_op(transformed)
    index_elasticsearch_op(transformed)
