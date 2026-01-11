import { useEffect, useState } from "react";
import type { Movie, Review } from "../types/movies";
import { getMovieByImdbID, getReviewsByMovie, checkInMyList, addToMyList, removeFromMyList } from "../services/movies";
import ReviewForm from "../components/ReviewForm";

type Props = {
  imdbID: string;
  onBack: () => void;
  onGoLogin?: () => void;
};

export default function MovieDetailPage({ imdbID, onBack, onGoLogin }: Props) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const [inMyList, setInMyList] = useState(false);
  const [loadingMyList, setLoadingMyList] = useState(false);
  
  const token = localStorage.getItem("filmly_token");
  const isAuthenticated = !!token;

  useEffect(() => {
    loadMovieDetail();
  }, [imdbID]);

  async function loadMovieDetail() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMovieByImdbID(imdbID);
      setMovie(data.movie);
      loadReviews(imdbID);
      if (isAuthenticated) {
        checkMyListStatus(imdbID);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al cargar la película");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews(id: string) {
    setLoadingReviews(true);
    try {
      const data = await getReviewsByMovie(id);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function checkMyListStatus(id: string) {
    try {
      const data = await checkInMyList(id);
      setInMyList(data.inList);
    } catch (err) {
      console.error("Error checking my list:", err);
    }
  }

  async function handleToggleMyList() {
    if (!movie?.imdbID) return;
    if (!isAuthenticated) {
      onGoLogin?.();
      return;
    }
    
    setLoadingMyList(true);
    try {
      if (inMyList) {
        await removeFromMyList(movie.imdbID);
        setInMyList(false);
      } else {
        await addToMyList({
          imdbID: movie.imdbID,
          title: movie.Title,
          poster: movie.Poster,
          year: movie.Year,
          type: movie.Type,
        });
        setInMyList(true);
      }
    } catch (err: any) {
      console.error("Error toggling my list:", err);
      alert(err?.response?.data?.error || "Error al actualizar tu lista");
    } finally {
      setLoadingMyList(false);
    }
  }

  function handleReviewSuccess() {
    setShowReviewForm(false);
    if (movie?.imdbID) {
      loadReviews(movie.imdbID);
    }
  }

  if (loading) {
    return (
      <div className="container my-5 text-center" style={{ padding: '4rem 0' }}>
        <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Cargando detalles de la película...
        </p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">
          <strong>Error:</strong> {error || "Película no encontrada"}
        </div>
        <button className="btn btn-back" onClick={onBack}>
          Volver
        </button>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="container py-4">
      {/* Botón volver */}
      <button className="btn btn-back mb-4" onClick={onBack}>
        Volver al buscador
      </button>

      {/* Hero Section */}
      <div className="movie-detail-container">
        <div className="row">
          {/* Poster */}
          <div className="col-md-4 mb-4">
            {movie.Poster && movie.Poster !== "N/A" ? (
              <img 
                src={movie.Poster} 
                alt={movie.Title} 
                className="img-fluid movie-poster-large w-100" 
              />
            ) : (
              <div 
                className="d-flex align-items-center justify-content-center movie-poster-large"
                style={{ height: "500px", backgroundColor: 'var(--bg-secondary)' }}
              >
                <span style={{ fontSize: '4rem', color: 'var(--text-muted)' }}>Sin póster</span>
              </div>
            )}

            {/* Botones de acción */}
            <div className="d-grid gap-3 mt-3">
              {isAuthenticated ? (
                <>
                  <button
                    className={`btn btn-lg ${inMyList ? "btn-danger" : "btn-filmly-primary"}`}
                    onClick={handleToggleMyList}
                    disabled={loadingMyList}
                    style={{ fontWeight: '600' }}
                  >
                    {loadingMyList ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Procesando...
                      </>
                    ) : inMyList ? (
                      "✓ En Mi Lista"
                    ) : (
                      "+ Agregar a Mi Lista"
                    )}
                  </button>
                  <button
                    className="btn btn-write-review btn-lg"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? "Cancelar" : " Escribir reseña"}
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-filmly-primary btn-lg" 
                  onClick={onGoLogin}
                  style={{ fontWeight: '600' }}
                >
                  Inicia sesión
                </button>
              )}
            </div>
          </div>

          {/* Información principal */}
          <div className="col-md-8">
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              {movie.Title}
            </h1>
            
            {/* Badges */}
            <div className="mb-3 d-flex flex-wrap gap-2">
              {movie.Year && <span className="badge badge-type">{movie.Year}</span>}
              {movie.Rated && movie.Rated !== "N/A" && <span className="badge badge-type">{movie.Rated}</span>}
              {movie.Runtime && movie.Runtime !== "N/A" && <span className="badge badge-type">⏱ {movie.Runtime}</span>}
              {movie.Type && <span className="badge badge-type">{movie.Type}</span>}
            </div>

            {/* Plot */}
            {movie.Plot && movie.Plot !== "N/A" && (
              <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {movie.Plot}
              </p>
            )}

            {/* Ratings destacados */}
            {(movie.imdbRating || movie.Metascore || avgRating) && (
              <div className="row g-3 mb-4">
                {movie.imdbRating && movie.imdbRating !== "N/A" && (
                  <div className="col-md-4">
                    <div className="rating-box">
                      <div className="rating-score">★ {movie.imdbRating}</div>
                      <div className="rating-label">IMDb Rating</div>
                      {movie.imdbVotes && movie.imdbVotes !== "N/A" && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {movie.imdbVotes} votos
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {movie.Metascore && movie.Metascore !== "N/A" && (
                  <div className="col-md-4">
                    <div className="rating-box">
                      <div className="rating-score">{movie.Metascore}</div>
                      <div className="rating-label">Metascore</div>
                    </div>
                  </div>
                )}
                {avgRating && (
                  <div className="col-md-4">
                    <div className="rating-box">
                      <div className="rating-score">★ {avgRating}</div>
                      <div className="rating-label">Filmly ({reviews.length})</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detalles en grid */}
            <div className="row g-3">
              {movie.Genre && movie.Genre !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>Género:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Genre}</div>
                </div>
              )}
              {movie.Director && movie.Director !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>Director:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Director}</div>
                </div>
              )}
              {movie.Actors && movie.Actors !== "N/A" && (
                <div className="col-md-12">
                  <strong style={{ color: 'var(--text-secondary)' }}>Actores:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Actors}</div>
                </div>
              )}
              {movie.Writer && movie.Writer !== "N/A" && (
                <div className="col-md-12">
                  <strong style={{ color: 'var(--text-secondary)' }}>Guionista:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Writer}</div>
                </div>
              )}
              {movie.Language && movie.Language !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>Idioma:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Language}</div>
                </div>
              )}
              {movie.Country && movie.Country !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>País:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Country}</div>
                </div>
              )}
              {movie.Released && movie.Released !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>Estreno:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Released}</div>
                </div>
              )}
              {movie.BoxOffice && movie.BoxOffice !== "N/A" && (
                <div className="col-md-6">
                  <strong style={{ color: 'var(--text-secondary)' }}>Taquilla:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.BoxOffice}</div>
                </div>
              )}
              {movie.Awards && movie.Awards !== "N/A" && (
                <div className="col-md-12">
                  <strong style={{ color: 'var(--text-secondary)' }}>Premios:</strong>
                  <div style={{ color: 'var(--text-primary)' }}>{movie.Awards}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de reseña */}
      {showReviewForm && movie.imdbID && (
        <div className="review-form-container mt-4">
          <ReviewForm
            imdbID={movie.imdbID}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reseñas */}
      <div className="mt-5">
        <h3 className="reviews-section-title">
          Reseñas de usuarios
        </h3>
        {loadingReviews ? (
          <div className="text-center py-5">
            <div className="spinner-border" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem' }}>✕</div>
            <h4 className="empty-state-title">Sin reseñas todavía</h4>
            <p className="empty-state-text">
              Sé la primera persona en compartir tu opinión sobre esta película
            </p>
            {isAuthenticated && !showReviewForm && (
              <button 
                className="btn btn-write-review mt-3"
                onClick={() => setShowReviewForm(true)}
              >
                 Escribir la primera reseña
              </button>
            )}
          </div>
        ) : (
          <div className="row g-4">
            {reviews.map((review) => {
              const username = review.userEmail?.split("@")[0] || "Anónimo";
              return (
                <div key={review._id} className="col-md-6">
                  <div className="review-card">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {username}
                        </strong>
                        <div className="review-rating mt-1">
                          ⭐ {review.rating}/10
                        </div>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0', lineHeight: '1.6' }}>
                      {review.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
