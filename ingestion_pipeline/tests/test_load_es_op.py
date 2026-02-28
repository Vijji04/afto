from unittest.mock import patch, MagicMock, call

from dagster import build_op_context, Failure
import pytest

from ingestion_pipeline.ops import index_elasticsearch_op


@pytest.fixture
def mock_opensearch():
    with patch("ingestion_pipeline.ops.OpenSearch") as MockOS:
        mock_client = MagicMock()
        MockOS.return_value = mock_client
        mock_client.indices.exists.return_value = False
        yield MockOS, mock_client


def test_es_creates_index_when_missing(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    mock_client.indices.exists.return_value = False
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    mock_client.indices.create.assert_called_once()
    create_args = mock_client.indices.create.call_args
    assert create_args[1]["index"] == "products"
    assert "mappings" in create_args[1]["body"]


def test_es_skips_index_creation_when_exists(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    mock_client.indices.exists.return_value = True
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    mock_client.indices.create.assert_not_called()


def test_es_indexes_all_products(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    assert mock_client.index.call_count == len(expected_flat_products)


def test_es_uses_source_id_as_doc_id(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    for i, c in enumerate(mock_client.index.call_args_list):
        assert c[1]["id"] == expected_flat_products[i]["source_id"]
        assert c[1]["index"] == "products"


def test_es_document_contains_expected_fields(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    first_doc = mock_client.index.call_args_list[0][1]["body"]
    assert "name" in first_doc
    assert "description" in first_doc
    assert "price" in first_doc
    assert "category" in first_doc


def test_es_continues_on_single_product_failure(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    mock_client.index.side_effect = [
        Exception("network error"),
        {"result": "created"},
        {"result": "created"},
    ]
    context = build_op_context()

    index_elasticsearch_op(context, expected_flat_products)

    assert mock_client.index.call_count == len(expected_flat_products)


def test_es_raises_failure_when_all_products_fail(mock_opensearch, expected_flat_products):
    _, mock_client = mock_opensearch
    mock_client.index.side_effect = Exception("total failure")
    context = build_op_context()

    with pytest.raises(Failure, match="All .* products failed"):
        index_elasticsearch_op(context, expected_flat_products)
