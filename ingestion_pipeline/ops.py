import json
import os
from pathlib import Path
from uuid import uuid4

import psycopg2
from dagster import op, OpExecutionContext, Failure, In, Out
from dotenv import load_dotenv
from opensearchpy import OpenSearch

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_JSON_PATH = str(PROJECT_ROOT / "crawler" / "output" / "products_canonical.json")


@op(out=Out(list))
def read_json_op(context: OpExecutionContext, json_path: str = DEFAULT_JSON_PATH) -> list:
    if not os.path.exists(json_path):
        context.log.error(f"JSON file not found: {json_path}")
        raise Failure(description=f"JSON file not found: {json_path}")

    try:
        with open(json_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        context.log.error(f"Failed to parse JSON: {e}")
        raise Failure(description=f"Failed to parse JSON: {e}")

    context.log.info(f"Loaded {len(data)} category groups from {json_path}")
    return data


@op(out=Out(list))
def transform_op(context: OpExecutionContext, category_groups: list) -> list:
    flat_products = []
    for group in category_groups:
        category = group["category"]
        subcategory = group.get("subcategory")
        for product in group["products"]:
            flat_products.append({
                "source_id": product["id"],
                "name": product["name"],
                "description": product["description"],
                "price": product["price"],
                "currency": product["currency"],
                "images": product["images"],
                "availability": product["availability"],
                "category": category,
                "subcategory": subcategory,
            })

    context.log.info(f"Flattened {len(flat_products)} products from {len(category_groups)} groups")
    return flat_products


_UPSERT_CATEGORY_SQL = """
INSERT INTO categories (id, name) VALUES (%s, %s)
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
RETURNING id;
"""

_UPSERT_SUBCATEGORY_SQL = """
INSERT INTO subcategories (id, name, category_id) VALUES (%s, %s, %s)
ON CONFLICT (name, category_id) DO UPDATE SET name = EXCLUDED.name
RETURNING id;
"""

_UPSERT_PRODUCT_SQL = """
INSERT INTO products (id, name, description, price, currency, availability, images, category_id, subcategory_id)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (id) DO UPDATE SET
    name           = EXCLUDED.name,
    description    = EXCLUDED.description,
    price          = EXCLUDED.price,
    currency       = EXCLUDED.currency,
    availability   = EXCLUDED.availability,
    images         = EXCLUDED.images,
    category_id    = EXCLUDED.category_id,
    subcategory_id = EXCLUDED.subcategory_id;
"""


def _resolve_categories(cur, products, context):
    unique_names = {p["category"] for p in products}
    cat_map = {}
    for name in unique_names:
        cur.execute(_UPSERT_CATEGORY_SQL, (str(uuid4()), name))
        cat_map[name] = cur.fetchone()[0]
    context.log.info(f"Resolved {len(cat_map)} categories")
    return cat_map


def _resolve_subcategories(cur, products, cat_map, context):
    pairs = {
        (p["subcategory"], p["category"])
        for p in products
        if p.get("subcategory") is not None
    }
    subcat_map = {}
    for subcat_name, cat_name in pairs:
        cat_id = cat_map[cat_name]
        cur.execute(_UPSERT_SUBCATEGORY_SQL, (str(uuid4()), subcat_name, cat_id))
        subcat_map[(subcat_name, cat_name)] = cur.fetchone()[0]
    context.log.info(f"Resolved {len(subcat_map)} subcategories")
    return subcat_map


@op
def load_postgres_op(context: OpExecutionContext, products: list) -> None:
    conn = psycopg2.connect(
        host=os.getenv("RDS_HOST"),
        dbname=os.getenv("RDS_DB"),
        user=os.getenv("RDS_USER"),
        password=os.getenv("RDS_PASSWORD"),
        sslmode=os.getenv("RDS_SSLMODE", "prefer"),  # set RDS_SSLMODE=require in production
    )
    try:
        cur = conn.cursor()

        cat_map = _resolve_categories(cur, products, context)
        subcat_map = _resolve_subcategories(cur, products, cat_map, context)

        params = [
            (
                p["source_id"],
                p["name"],
                p["description"],
                p["price"],
                p["currency"],
                p["availability"],
                p["images"],
                cat_map[p["category"]],
                subcat_map.get((p["subcategory"], p["category"])),
            )
            for p in products
        ]
        cur.executemany(_UPSERT_PRODUCT_SQL, params)
        conn.commit()
        context.log.info(f"Upserted {len(products)} products into PostgreSQL")
    except Exception as e:
        conn.rollback()
        context.log.error(f"PostgreSQL load failed: {e}")
        raise Failure(description=f"PostgreSQL load failed: {e}")
    finally:
        conn.close()


_ES_INDEX = "products"

_ES_MAPPING = {
    "mappings": {
        "properties": {
            "name": {"type": "text", "analyzer": "standard"},
            "description": {"type": "text", "analyzer": "standard"},
            "price": {"type": "float"},
            "currency": {"type": "keyword"},
            "category": {"type": "keyword"},
            "subcategory": {"type": "keyword"},
            "availability": {"type": "keyword"},
            "images": {"type": "keyword"},
        }
    }
}


@op
def index_elasticsearch_op(context: OpExecutionContext, products: list) -> None:
    es = OpenSearch(os.getenv("OPENSEARCH_HOST"))

    if not es.indices.exists(index=_ES_INDEX):
        es.indices.create(index=_ES_INDEX, body=_ES_MAPPING)
        context.log.info(f"Created index '{_ES_INDEX}'")

    success_count = 0
    fail_count = 0

    for p in products:
        doc = {
            "name": p["name"],
            "description": p["description"],
            "price": p["price"],
            "currency": p["currency"],
            "category": p["category"],
            "subcategory": p.get("subcategory"),
            "availability": p["availability"],
            "images": p.get("images", []),
        }
        try:
            es.index(index=_ES_INDEX, id=p["source_id"], body=doc)
            success_count += 1
        except Exception as e:
            fail_count += 1
            context.log.warning(f"Failed to index product {p['source_id']}: {e}")

    context.log.info(
        f"Elasticsearch indexing complete: {success_count} succeeded, {fail_count} failed"
    )

    if fail_count == len(products):
        raise Failure(
            description=f"All {fail_count} products failed to index into Elasticsearch"
        )
