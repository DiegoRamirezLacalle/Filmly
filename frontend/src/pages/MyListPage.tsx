import { useEffect, useState } from "react";
import { getMyList, removeFromMyList } from "../services/movies";
import type { MyListItem } from "../types/movies";

export default function MyListPage({ onGoLogin, onOpenDetail }: { onGoLogin: () => void; onOpenDetail: (imdbID: string) => void }) {
  const [items, setItems] = useState<MyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay token
    const token = localStorage.getItem("filmly_token");
    if (!token) {
      // Redirigir a login si no está autenticado
      onGoLogin();
      return;
    }
    loadMyList();
  }, []);

  async function loadMyList() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyList();
      setItems(data.items || []);
    } catch (err: any) {
      // Si es 401, el interceptor ya limpió el token
      if (err?.response?.status === 401) {
        onGoLogin();
        return;
      }
      setError(err?.response?.data?.error || err?.message || "Error al cargar tu lista");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(imdbID: string) {
    setRemovingId(imdbID);
    try {
      await removeFromMyList(imdbID);
      setItems(items.filter((item) => item.imdbID !== imdbID));
    } catch (err: any) {
      alert(err?.response?.data?.error || "Error al eliminar de tu lista");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Cargando tu lista...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <strong>❌ Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>
          Mi Lista
        </h2>
        <span 
          className="badge badge-type" 
          style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}
        >
          {items.length} {items.length === 1 ? 'película' : 'películas'}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✕</div>
          <h3 className="empty-state-title">Tu lista está vacía</h3>
          <p className="empty-state-text">
            Empieza a agregar películas y series que quieras ver más tarde.
            <br />
            Busca tus favoritas y guárdalas aquí con un solo clic.
          </p>
          <button 
            className="btn btn-filmly-primary btn-lg mt-3"
            onClick={() => window.location.reload()}
          >
            Buscar películas
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {items.map((item) => (
            <div key={item._id} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <div className="movie-card" style={{ cursor: 'default' }}>
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenDetail(item.imdbID)}
                >
                  {item.poster && item.poster !== "N/A" ? (
                    <img
                      src={item.poster}
                      alt={item.title || "Movie"}
                    />
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
                      <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Sin póster</span>
                    </div>
                  )}
                </div>
                <div className="movie-card-body">
                  <h6
                    className="movie-card-title"
                    style={{ cursor: "pointer" }}
                    onClick={() => onOpenDetail(item.imdbID)}
                  >
                    {item.title || "Sin título"}
                  </h6>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge badge-type" style={{ fontSize: '0.65rem' }}>
                      {item.type || "movie"}
                    </span>
                    <span className="movie-card-meta">{item.year || "—"}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Agregada: {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                  <button
                    className="btn btn-danger btn-sm w-100"
                    onClick={() => handleRemove(item.imdbID)}
                    disabled={removingId === item.imdbID}
                    style={{ 
                      fontSize: '0.8rem',
                      padding: '0.4rem 0.5rem'
                    }}
                  >
                    {removingId === item.imdbID ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Quitando...
                      </>
                    ) : (
                      "Quitar"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
