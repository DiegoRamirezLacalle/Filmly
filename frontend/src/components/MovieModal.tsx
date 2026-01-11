import { useEffect, useState } from "react";
import type { Movie, Review } from "../types/movies";
import { getReviewsByMovie, checkInMyList, addToMyList, removeFromMyList } from "../services/movies";
import ReviewForm from "./ReviewForm";

type Props = {
  movie: Movie | null;
  onClose: () => void;
  source?: string | null;
};

export default function MovieModal({ movie, onClose, source }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [inMyList, setInMyList] = useState(false);
  const [loadingMyList, setLoadingMyList] = useState(false);
  const token = localStorage.getItem("filmly_token");
  const isAuthenticated = !!token;

  async function loadReviews() {
    if (!movie?.imdbID) return;
    setLoadingReviews(true);
    try {
      const data = await getReviewsByMovie(movie.imdbID);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  }

  async function checkMyListStatus() {
    if (!movie?.imdbID || !isAuthenticated) return;
    try {
      const data = await checkInMyList(movie.imdbID);
      setInMyList(data.inList);
    } catch (err) {
      console.error("Error checking my list:", err);
    }
  }

  async function handleToggleMyList() {
    if (!movie?.imdbID) return;
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

  useEffect(() => {
    if (movie?.imdbID) {
      loadReviews();
      checkMyListStatus();
      setShowReviewForm(false);
    }
  }, [movie?.imdbID]);

  if (!movie) return null;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show" onClick={onClose} />

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-0">{movie.Title}</h5>
                <small className="text-muted">
                  {movie.Year ?? "—"}
                  {source ? ` · ${source}` : ""}
                  {avgRating && (
                    <span className="ms-2">
                      ⭐ <strong>{avgRating}</strong>/10 ({reviews.length}{" "}
                      {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </small>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  {movie.Poster && movie.Poster !== "N/A" ? (
                    <img src={movie.Poster} className="img-fluid rounded" alt={movie.Title} />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ height: 280 }}>
                      <span className="text-muted">Sin póster</span>
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-8">
                  <dl className="row mb-0">
                    <dt className="col-sm-3">Director</dt>
                    <dd className="col-sm-9">{movie.Director ?? "—"}</dd>

                    <dt className="col-sm-3">Actores</dt>
                    <dd className="col-sm-9">{movie.Actors ?? "—"}</dd>

                    <dt className="col-sm-3">Género</dt>
                    <dd className="col-sm-9">{movie.Genre ?? "—"}</dd>

                    <dt className="col-sm-3">Plot</dt>
                    <dd className="col-sm-9">{movie.Plot ?? "—"}</dd>

                    <dt className="col-sm-3">imdbID</dt>
                    <dd className="col-sm-9">{movie.imdbID ?? "—"}</dd>
                  </dl>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Reviews ({reviews.length})</h6>
                  {isAuthenticated && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      {showReviewForm ? "Cancelar" : "Escribir Review"}
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && movie.imdbID && (
                  <ReviewForm
                    imdbID={movie.imdbID}
                    onSuccess={() => {
                      setShowReviewForm(false);
                      loadReviews();
                    }}
                  />
                )}

                {/* Reviews List */}
                {loadingReviews ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="alert alert-info" role="alert">
                    No hay reviews todavía. {isAuthenticated && "¡Sé el primero en escribir una!"}
                  </div>
                ) : (
                  <div className="list-group">
                    {reviews.map((review) => {
                      const displayName = review.userEmail 
                        ? review.userEmail.split('@')[0] 
                        : "Usuario";
                      
                      return (
                        <div key={review._id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <strong className="text-primary">{displayName}</strong>
                              <span className="ms-2 badge bg-warning text-dark">
                                {review.rating}/10
                              </span>
                            </div>
                            <small className="text-muted">
                              {new Date(review.updatedAt || review.createdAt).toLocaleDateString()}
                            </small>
                          </div>
                          {review.text && <p className="mb-0">{review.text}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {isAuthenticated && (
                <button
                  type="button"
                  className={`btn ${inMyList ? "btn-success" : "btn-outline-primary"}`}
                  onClick={handleToggleMyList}
                  disabled={loadingMyList}
                >
                  {loadingMyList ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Procesando...
                    </>
                  ) : inMyList ? (
                    <>✓ En Mi Lista</>
                  ) : (
                    <>+ Agregar a Mi Lista</>
                  )}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}