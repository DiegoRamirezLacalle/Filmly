import { Router } from "express";
import { getDb } from "../lib/mongo.js";
import { searchMovieByTitle, searchMoviesByQuery, searchMovieByImdbID } from "../services/omdb.service.js";
import { indexMovie } from "../services/elastic-index.service.js";
import { elastic, indexName } from "../lib/elastic.js";

const router = Router();

/**
 * GET /search?title=Interstellar
 * Devuelve detalle: cache Mongo -> OMDb y guarda cache + indexa en ES
 */
router.get("/search", async (req, res) => {
  const title = String(req.query.title || "").trim();
  if (!title) return res.status(400).json({ error: "title query param required", details: "Provide title to search" });

  const db = await getDb();
  const collection = db.collection("movies_cache");

  const cached = await collection.findOne({ Title: title });
  if (cached) {
    try { await indexMovie(cached); } catch {}
    return res.json({ source: "cache", movie: cached });
  }

  const movie = await searchMovieByTitle(title);
  if (!movie) return res.status(404).json({ error: "Movie not found", details: `No movie found with title: ${title}` });

  await collection.insertOne(movie);

  try { await indexMovie(movie); } catch {}

  return res.json({ source: "omdb", movie });
});

/**
 * GET /detail?imdbID=tt0816692
 * Devuelve detalle completo: cache Mongo -> OMDb y guarda cache
 */
router.get("/detail", async (req, res) => {
  const imdbID = String(req.query.imdbID || "").trim();
  if (!imdbID) return res.status(400).json({ error: "imdbID query param required", details: "Provide imdbID to get details" });

  const db = await getDb();
  const collection = db.collection("movies_cache");

  const cached = await collection.findOne({ imdbID });
  if (cached) {
    return res.json({ source: "cache", movie: cached });
  }

  const movie = await searchMovieByImdbID(imdbID);
  if (!movie) return res.status(404).json({ error: "Movie not found", details: `No movie found with imdbID: ${imdbID}` });

  await collection.insertOne(movie);
  try { await indexMovie(movie); } catch {}

  return res.json({ source: "omdb", movie });
});

/**
 * GET /search-es?q=star%20wars
 * Busca en ES; si ES falla o no hay hits -> fallback OMDb (search)
 */
router.get("/search-es", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "q query param required", details: "Provide search query" });

  const omdbFallback = async (reason: "es_error" | "no_hits") => {
    try {
      const data = await searchMoviesByQuery(q, 1);
      const db = await getDb();
      const collection = db.collection("movies_cache");

      // Enriquecer resultados con información completa
      const enrichedHits = await Promise.all(
        (data?.Search ?? []).slice(0, 10).map(async (m: any) => {
          // Verificar si ya tenemos los datos completos en cache
          let fullMovie = await collection.findOne({ imdbID: m.imdbID });
          
          // Si no está en cache o solo tiene datos parciales, obtener datos completos
          if (!fullMovie || !fullMovie.Director) {
            try {
              fullMovie = await searchMovieByImdbID(m.imdbID);
              if (fullMovie) {
                await collection.replaceOne(
                  { imdbID: m.imdbID },
                  fullMovie,
                  { upsert: true }
                );
                // Indexar en Elasticsearch
                try { await indexMovie(fullMovie); } catch {}
              }
            } catch (err) {
              console.error(`Failed to enrich movie ${m.imdbID}:`, err);
              fullMovie = m; // Usar datos parciales si falla
            }
          }

          return {
            id: fullMovie?.imdbID || m.imdbID,
            score: null,
            movie: {
              Title: fullMovie?.Title || m.Title,
              Year: fullMovie?.Year || m.Year,
              imdbID: fullMovie?.imdbID || m.imdbID,
              Type: fullMovie?.Type || m.Type,
              Poster: fullMovie?.Poster || m.Poster,
              Director: fullMovie?.Director,
              Actors: fullMovie?.Actors,
              Plot: fullMovie?.Plot,
              Genre: fullMovie?.Genre,
              _fallback: "omdb",
            },
          };
        })
      );

      return res.json({ q, count: enrichedHits.length, hits: enrichedHits, source: "omdb-fallback", reason });
    } catch (e: any) {
      return res.status(503).json({ error: "Search unavailable", details: String(e?.message || e) });
    }
  };

  try {
    const result = await elastic.search({
      index: indexName,
      query: {
        bool: {
          should: [
            {
              match: {
                Title: {
                  query: q,
                  boost: 1,
                },
              },
            },
            {
              match: {
                Director: {
                  query: q,
                  boost: 5,
                },
              },
            },
            {
              match: {
                Actors: {
                  query: q,
                  boost: 5,
                },
              },
            },
            {
              match: {
                Plot: {
                  query: q,
                  boost: 0.3,
                },
              },
            },
            {
              match: {
                Genre: {
                  query: q,
                  boost: 0.3,
                },
              },
            },
          ],
        },
      },
      size: 10,
    });

    const hits = (result.hits.hits || []).map((h: any) => ({
      id: h._id,
      score: h._score,
      movie: h._source,
    }));

    // Si no hay resultados O hay muy pocos (menos de 3), usa OMDb fallback
    if (hits.length < 3) return omdbFallback("no_hits");

    return res.json({ q, count: hits.length, hits, source: "elastic" });
  } catch {
    return omdbFallback("es_error");
  }
});

export default router;
