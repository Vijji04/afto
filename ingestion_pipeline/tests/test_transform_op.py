from dagster import build_op_context

from ingestion_pipeline.ops import transform_op


def test_transform_flattens_nested_groups(sample_category_groups, expected_flat_products):
    context = build_op_context()
    result = transform_op(context, sample_category_groups)

    assert result == expected_flat_products


def test_transform_empty_input():
    context = build_op_context()
    result = transform_op(context, [])

    assert result == []


def test_transform_preserves_null_subcategory():
    groups = [
        {
            "category": "Spices",
            "subcategory": None,
            "products": [
                {
                    "id": "9999",
                    "name": "Turmeric",
                    "description": "Ground turmeric",
                    "price": 3.99,
                    "currency": "CAD",
                    "images": [],
                    "availability": "in_stock",
                }
            ],
        }
    ]
    context = build_op_context()
    result = transform_op(context, groups)

    assert len(result) == 1
    assert result[0]["subcategory"] is None
    assert result[0]["source_id"] == "9999"
    assert result[0]["category"] == "Spices"


def test_transform_maps_id_to_source_id(sample_category_groups):
    context = build_op_context()
    result = transform_op(context, sample_category_groups)

    for product in result:
        assert "source_id" in product
        assert "id" not in product
