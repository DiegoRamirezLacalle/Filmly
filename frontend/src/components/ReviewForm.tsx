import { useState } from "react";
import { createOrUpdateReview } from "../services/movies";

type Props = {
  imdbID: string;
  onSuccess: () => void;
  onCancel?: () => void;
};

export default function ReviewForm({ imdbID, onSuccess, onCancel }: Props) {
  const [rating, setRating] = useState<number>(10);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createOrUpdateReview({ imdbID, rating, text: text.trim() });
      setRating(10);
      setText("");
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Error al guardar la review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h6 className="review-form-title">Deja tu reseña</h6>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          />
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="rating" className="form-label">
          Puntuación: <strong>{rating}/10</strong>
        </label>
        <input
          type="range"
          className="form-range"
          id="rating"
          min="1"
          max="10"
          step="1"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="text" className="form-label">
          Comentario (opcional)
        </label>
        <textarea
          className="form-control"
          id="text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu opinión sobre esta película..."
        />
      </div>

      <div className="d-flex gap-2">
        {onCancel && (
          <button 
            type="button" 
            className="btn btn-filmly-secondary" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button type="submit" className="btn btn-filmly-primary flex-grow-1" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Guardando...
            </>
          ) : (
            "Guardar Reseña"
          )}
        </button>
      </div>
    </form>
  );
}