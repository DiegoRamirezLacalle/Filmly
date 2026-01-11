#!/usr/bin/env bash
set -e

echo "Mongo..."
docker exec -i "$(docker ps -qf name=mongo)" mongosh --quiet --eval 'db.runCommand({ ping: 1 })' >/dev/null
echo "OK"

echo "Elasticsearch..."
curl -fsS http://localhost:9200 >/dev/null
echo "OK"

echo "Kibana..."
curl -fsS http://localhost:5601 >/dev/null || echo "Kibana aún arrancando (normal)."
