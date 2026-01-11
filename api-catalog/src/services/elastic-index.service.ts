import { elastic, indexName } from "../lib/elastic.js";

export async function ensureMoviesIndex() {
  const exists = await elastic.indices.exists({ index: indexName });
  const indexExists =
    typeof exists === "boolean" ? exists : (exists as any)?.body === true;

  if (!indexExists) {
    await elastic.indices.create({
      index: indexName,
      mappings: {
        properties: {
          Title: { type: "text" },
          Year: { type: "keyword" },
          Genre: { type: "text" },
          Director: { type: "text" },
          Actors: { type: "text" },
          Plot: { type: "text" },
          imdbID: { type: "keyword" },
        },
      },
    });
  }
}

export async function indexMovie(movie: any) {
  if (!movie) return;

  const { _id, ...doc } = movie;
  const id = doc?.imdbID || `${doc?.Title ?? "unknown"}-${doc?.Year ?? "unknown"}`;

  await elastic.index({
    index: indexName,
    id,          
    document: doc, 
    refresh: false,
  });
}
