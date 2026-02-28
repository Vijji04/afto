from dagster import build_op_context, Failure
import pytest

from ingestion_pipeline.ops import read_json_op


def test_read_json_op_returns_category_groups(tmp_json_file, sample_category_groups):
    context = build_op_context()
    result = read_json_op(context, tmp_json_file)

    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["category"] == "Atta"
    assert len(result[0]["products"]) == 2
    assert result[1]["category"] == "Rice"


def test_read_json_op_raises_on_missing_file():
    context = build_op_context()
    with pytest.raises(Failure, match="not found"):
        read_json_op(context, "/nonexistent/path/products.json")


def test_read_json_op_raises_on_invalid_json(tmp_path):
    bad_file = tmp_path / "bad.json"
    bad_file.write_text("{not valid json")

    context = build_op_context()
    with pytest.raises(Failure, match="Failed to parse"):
        read_json_op(context, str(bad_file))
