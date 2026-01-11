import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { SearchEsResponse } from "../types/movies";

// Tipos OMDb: movie | series | episode
type OmdbType = "" | "movie" | "series" | "episode";

type Props = {
  onOpenDetail: (imdbID: string) => void;
};

export default function SearchPage({ onOpenDetail }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchEsResponse["hits"]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ nuevos estados para filtro + paginación
  const [type, setType] = useState<OmdbType>(""); // "" = todos
  const [page, setPage] = useState(1);
  const [count, setCount] = useState<number | null>(null); // count devuelto por API (hits en esa página)
  const [source, setSource] = useState<string | null>(null); // "elastic" | "omdb-fallback"...
  const [reason, setReason] = useState<string | null>(null); // "no_hits" | "es_error"...


  const canSearch = useMemo(() => q.trim().length >= 2, [q]);

  async function search() {
    if (!canSearch) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<
        SearchEsResponse & { count?: number; source?: string; reason?: string }
      >("/api/movies/search-es", {
        params: {
          q: q.trim(),
          type: type || undefined, // no mandamos param si es ""
          page,                    // para fallback OMDb
        },
      });

      setHits(res.data.hits ?? []);
      setCount(typeof res.data.count === "number" ? res.data.count : null);
      setSource((res.data as any).source ?? null);
      setReason((res.data as any).reason ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Error buscando");
      setHits([]);
      setCount(null);
      setSource(null);
      setReason(null);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Cuando cambia q o type, volvemos a página 1 (si no, la paginación se lía)
  useEffect(() => {
    setPage(1);
  }, [q, type]);

  // Debounce de búsqueda (también depende de page y type)
  useEffect(() => {
    if (!canSearch) {
      setHits([]);
      setCount(null);
      setSource(null);
      setReason(null);
      return;
    }
    const t = setTimeout(() => search(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, type, page]);

  const showEmpty =
    !loading &&
    !error &&
    canSearch &&
    hits.length === 0;

  const showPager =
    canSearch &&
    !loading &&
    !error &&
    // si hay resultados o si estamos en página >1 (para poder volver)
    (hits.length > 0 || page > 1);

  return (
    <div className="container py-4">
      <div className="text-center mb-5">
        <h1 className="hero-title">
          Descubre películas y series
        </h1>
        <p className="hero-subtitle">
          Busca en nuestra base de datos y explora el mundo del cine
        </p>
      </div>

      <div className="search-section mb-4">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-6">
          <label className="form-label">Buscar</label>
          <input
            className="form-control form-control-lg"
            placeholder="Título, director, actor... (ej: Interstellar, Nolan, DiCaprio)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label">Tipo</label>
          <select
            className="form-select form-select-lg"
            value={type}
            onChange={(e) => setType(e.target.value as OmdbType)}
          >
            <option value="">Todos</option>
            <option value="movie">Películas</option>
            <option value="series">Series</option>
            <option value="episode">Episodios</option>
          </select>
        </div>

        <div className="col-12 col-md-3 d-grid">
          <button 
            className="btn btn-filmly-primary btn-lg" 
            onClick={search} 
            disabled={!canSearch || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Buscando...
              </>
            ) : (
              "Buscar"
            )}
          </button>
        </div>
      </div>
      </div>

      {/* Info de fuente */}
      {(source || reason) && (
        <div className="mb-3">
          <span className="badge badge-type me-2">
            {source === "elastic" ? "Elasticsearch" : "OMDb API"}
          </span>
          {reason && (
            <span className="badge" style={{ backgroundColor: 'var(--bg-card)' }}>
              {reason === "no_hits" ? "Sin resultados en caché" : "Error en búsqueda local"}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Paginación superior */}
      {showPager && (
        <div className="d-flex align-items-center justify-content-between mb-4 p-3" 
             style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <button
            className="btn btn-filmly-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            ← Anterior
          </button>

          <div style={{ color: 'var(--text-secondary)' }}>
            Página <strong style={{ color: 'var(--accent-yellow)' }}>{page}</strong>
            {typeof count === "number" && ` · ${count} resultados`}
          </div>

          <button
            className="btn btn-filmly-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || hits.length === 0}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Resultados */}
      <div className="row g-4">
        {hits.map((h) => (
          <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={h.id}>
            <div 
              className="movie-card"
              onClick={() => h.movie.imdbID && onOpenDetail(h.movie.imdbID)}
            >
              {h.movie.Poster && h.movie.Poster !== "N/A" ? (
                <img src={h.movie.Poster} alt={h.movie.Title} />
              ) : (
                <div 
                  style={{ 
                    height: '350px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '2px solid var(--accent-yellow)'
                  }}
                >
                  <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>Sin póster</span>
                </div>
              )}

              <div className="movie-card-body">
                <h5 className="movie-card-title">{h.movie.Title}</h5>
                
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge badge-type">{h.movie.Type || "movie"}</span>
                  <span className="movie-card-meta">{h.movie.Year || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {showEmpty && (
          <div className="col-12">
            <div className="empty-state">
              <div className="empty-state-icon">✕</div>
              <h3 className="empty-state-title">Sin resultados</h3>
              <p className="empty-state-text">
                No encontramos películas con "{q}". Prueba con otro título, director o actor.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Paginación inferior */}
      {showPager && hits.length > 0 && (
        <div className="d-flex align-items-center justify-content-between mt-4 p-3" 
             style={{ backgroundColor: 'var(--bg-card)', borderRadius: '8px' }}>
          <button
            className="btn btn-filmly-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            ← Anterior
          </button>

          <div style={{ color: 'var(--text-secondary)' }}>
            Página <strong style={{ color: 'var(--accent-yellow)' }}>{page}</strong>
          </div>

          <button
            className="btn btn-filmly-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || hits.length === 0}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
