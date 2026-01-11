type Props = {
  movie: any;
  onClick: () => void;
};

export default function MovieCard({ movie, onClick }: Props) {
  return (
    <div className="col-md-4 mb-3">
      <div className="card h-100 shadow-sm" onClick={onClick} style={{ cursor: "pointer" }}>
        {movie.Poster && movie.Poster !== "N/A" && (
          <img src={movie.Poster} className="card-img-top" alt={movie.Title} />
        )}
        <div className="card-body">
          <h5 className="card-title">{movie.Title}</h5>
          <p className="card-text text-muted">{movie.Year}</p>
        </div>
      </div>
    </div>
  );
}
