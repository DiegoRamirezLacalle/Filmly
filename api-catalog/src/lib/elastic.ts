import { Client } from "@elastic/elasticsearch";

const node = process.env.ELASTIC_URL || "http://elasticsearch:9200";
export const elastic = new Client({ node });

export const indexName = process.env.ELASTIC_INDEX || "movies";
