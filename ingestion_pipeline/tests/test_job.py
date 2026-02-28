import json
from unittest.mock import patch, MagicMock, mock_open

from ingestion_pipeline.jobs import ingestion_job


_SAMPLE_JSON = json.dumps([
    {
        "category": "Test",
        "subcategory": None,
        "products": [
            {
                "id": "1",
                "name": "Test Product",
                "description": "A test",
                "price": 9.99,
                "currency": "CAD",
                "images": [],
                "availability": "in_stock",
            }
        ],
    }
])


def test_ingestion_job_defined():
    assert ingestion_job is not None
    assert ingestion_job.name == "ingestion_job"


def test_ingestion_job_has_all_ops():
    op_names = {node.name for node in ingestion_job.nodes}
    assert "read_json_op" in op_names
    assert "transform_op" in op_names
    assert "load_postgres_op" in op_names
    assert "index_elasticsearch_op" in op_names


@patch("ingestion_pipeline.ops.OpenSearch")
@patch("ingestion_pipeline.ops.psycopg2")
@patch("ingestion_pipeline.ops.os.path.exists", return_value=True)
@patch("builtins.open", mock_open(read_data=_SAMPLE_JSON))
def test_ingestion_job_executes_end_to_end(mock_exists, mock_psycopg2, mock_opensearch):
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = ("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",)
    mock_conn.cursor.return_value = mock_cursor
    mock_psycopg2.connect.return_value = mock_conn

    mock_es_client = MagicMock()
    mock_opensearch.return_value = mock_es_client
    mock_es_client.indices.exists.return_value = True

    result = ingestion_job.execute_in_process()

    assert result.success
