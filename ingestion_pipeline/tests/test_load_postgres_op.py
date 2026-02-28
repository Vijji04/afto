from unittest.mock import patch, MagicMock, call

from dagster import build_op_context, Failure
import pytest

from ingestion_pipeline.ops import load_postgres_op


@pytest.fixture
def mock_pg_connect():
    with patch("ingestion_pipeline.ops.psycopg2") as mock_psycopg2:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_psycopg2.connect.return_value = mock_conn
        mock_cursor.fetchone.return_value = ("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",)
        yield mock_psycopg2, mock_conn, mock_cursor


def test_load_postgres_upserts_categories(mock_pg_connect, expected_flat_products):
    _, _, mock_cursor = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    cat_calls = [
        c for c in mock_cursor.execute.call_args_list
        if "INSERT INTO categories" in str(c)
    ]
    assert len(cat_calls) > 0
    sql = cat_calls[0][0][0]
    assert "ON CONFLICT (name)" in sql
    assert "RETURNING id" in sql


def test_load_postgres_upserts_subcategories(mock_pg_connect, expected_flat_products):
    _, _, mock_cursor = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    subcat_calls = [
        c for c in mock_cursor.execute.call_args_list
        if "INSERT INTO subcategories" in str(c)
    ]
    assert len(subcat_calls) > 0
    sql = subcat_calls[0][0][0]
    assert "ON CONFLICT (name, category_id)" in sql
    assert "RETURNING id" in sql


def test_load_postgres_upserts_products(mock_pg_connect, expected_flat_products):
    _, _, mock_cursor = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    prod_calls = mock_cursor.executemany.call_args_list
    assert len(prod_calls) == 1

    sql = prod_calls[0][0][0]
    assert "INSERT INTO products" in sql
    assert "ON CONFLICT (id) DO UPDATE" in sql

    params = prod_calls[0][0][1]
    assert len(params) == len(expected_flat_products)


def test_load_postgres_fetches_uuid_after_category_upsert(mock_pg_connect, expected_flat_products):
    _, _, mock_cursor = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    assert mock_cursor.fetchone.call_count >= 2  # at least 2 unique categories


def test_load_postgres_null_subcategory_yields_null_subcategory_id(mock_pg_connect):
    products_with_null_subcat = [
        {
            "source_id": "999",
            "name": "Test",
            "description": "",
            "price": 1.00,
            "currency": "CAD",
            "images": [],
            "availability": "in_stock",
            "category": "Snacks",
            "subcategory": None,
        }
    ]
    _, _, mock_cursor = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, products_with_null_subcat)

    prod_params = mock_cursor.executemany.call_args_list[0][0][1]
    product_tuple = prod_params[0]
    subcategory_id_pos = -1  # last position before we know the layout
    assert None in product_tuple


def test_load_postgres_commits_on_success(mock_pg_connect, expected_flat_products):
    _, mock_conn, _ = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    mock_conn.commit.assert_called_once()


def test_load_postgres_rolls_back_on_error(mock_pg_connect, expected_flat_products):
    _, mock_conn, mock_cursor = mock_pg_connect
    mock_cursor.executemany.side_effect = Exception("DB error")
    context = build_op_context()

    with pytest.raises(Failure, match="PostgreSQL load failed"):
        load_postgres_op(context, expected_flat_products)

    mock_conn.rollback.assert_called_once()


def test_load_postgres_closes_connection_on_success(mock_pg_connect, expected_flat_products):
    _, mock_conn, _ = mock_pg_connect
    context = build_op_context()

    load_postgres_op(context, expected_flat_products)

    mock_conn.close.assert_called_once()


def test_load_postgres_closes_connection_on_failure(mock_pg_connect, expected_flat_products):
    _, mock_conn, mock_cursor = mock_pg_connect
    mock_cursor.executemany.side_effect = Exception("DB error")
    context = build_op_context()

    with pytest.raises(Failure):
        load_postgres_op(context, expected_flat_products)

    mock_conn.close.assert_called_once()
