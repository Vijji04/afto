import json
import pytest


@pytest.fixture
def sample_category_groups():
    return [
        {
            "category": "Atta",
            "subcategory": None,
            "products": [
                {
                    "id": "1001",
                    "name": "Whole Wheat Flour 20lb",
                    "description": "Premium whole wheat flour",
                    "price": 16.99,
                    "currency": "CAD",
                    "images": ["https://cdn.example.com/img1.jpg"],
                    "availability": "in_stock",
                },
                {
                    "id": "1002",
                    "name": "Multigrain Atta 20lb",
                    "description": "",
                    "price": 12.99,
                    "currency": "CAD",
                    "images": [],
                    "availability": "in_stock",
                },
            ],
        },
        {
            "category": "Rice",
            "subcategory": "Basmati",
            "products": [
                {
                    "id": "2001",
                    "name": "Basmati Rice 10lb",
                    "description": "Aged basmati rice",
                    "price": 24.99,
                    "currency": "CAD",
                    "images": [
                        "https://cdn.example.com/rice1.jpg",
                        "https://cdn.example.com/rice2.jpg",
                    ],
                    "availability": "out_of_stock",
                }
            ],
        },
    ]


@pytest.fixture
def expected_flat_products():
    return [
        {
            "source_id": "1001",
            "name": "Whole Wheat Flour 20lb",
            "description": "Premium whole wheat flour",
            "price": 16.99,
            "currency": "CAD",
            "images": ["https://cdn.example.com/img1.jpg"],
            "availability": "in_stock",
            "category": "Atta",
            "subcategory": None,
        },
        {
            "source_id": "1002",
            "name": "Multigrain Atta 20lb",
            "description": "",
            "price": 12.99,
            "currency": "CAD",
            "images": [],
            "availability": "in_stock",
            "category": "Atta",
            "subcategory": None,
        },
        {
            "source_id": "2001",
            "name": "Basmati Rice 10lb",
            "description": "Aged basmati rice",
            "price": 24.99,
            "currency": "CAD",
            "images": [
                "https://cdn.example.com/rice1.jpg",
                "https://cdn.example.com/rice2.jpg",
            ],
            "availability": "out_of_stock",
            "category": "Rice",
            "subcategory": "Basmati",
        },
    ]


@pytest.fixture
def tmp_json_file(tmp_path, sample_category_groups):
    path = tmp_path / "products_canonical.json"
    path.write_text(json.dumps(sample_category_groups, indent=2))
    return str(path)
