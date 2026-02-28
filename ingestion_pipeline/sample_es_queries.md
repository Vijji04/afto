# Sample Elasticsearch / OpenSearch Queries

All examples target the `products` index.

## 1. Full-text search by product name

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": "wheat flour"
    }
  }
}
```

## 2. Filter by category

```json
GET /products/_search
{
  "query": {
    "term": {
      "category": "Atta"
    }
  }
}
```

## 3. Price range query

```json
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 5.00,
        "lte": 20.00
      }
    }
  }
}
```

## 4. Combined: category + price range + availability

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "category": "Atta" } },
        { "term": { "availability": "in_stock" } },
        { "range": { "price": { "lte": 18.00 } } }
      ]
    }
  }
}
```

## 5. Fuzzy search (handles typos)

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "aashirvad",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

## 6. Aggregate: average price per category

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category" },
      "aggs": {
        "avg_price": { "avg": { "field": "price" } }
      }
    }
  }
}
```

## 7. Search by description with highlighting

```json
GET /products/_search
{
  "query": {
    "match": {
      "description": "organic"
    }
  },
  "highlight": {
    "fields": {
      "description": {}
    }
  }
}
```
