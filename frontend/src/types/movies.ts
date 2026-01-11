export type Movie = {
  Title: string;
  Year?: string;
  Type?: "movie" | "series" | "episode"; 
  Poster?: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  imdbID?: string;
  imdbRating?: string;
  Runtime?: string;
  Released?: string;
  Writer?: string;
  Language?: string;
  Country?: string;
  Awards?: string;
  Rated?: string;
  Metascore?: string;
  imdbVotes?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Ratings?: Array<{
    Source: string;
    Value: string;
  }>;

  _fallback?: "omdb";
};

export type SearchEsHit = {
  id: string;
  score: number | null; 
  movie: Movie;
};

export type SearchEsResponse = {
  q: string;
  count: number;
  hits: SearchEsHit[];

  source?: "elastic" | "omdb-fallback";
  reason?: "es_error" | "no_hits";
  page?: number;
  type?: "movie" | "series" | "episode" | null;
  totalResults?: number | null;
};

export type Review = {
  _id: string;
  imdbID: string;
  userId: string;
  userEmail: string | null;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewsResponse = {
  imdbID: string;
  count: number;
  reviews: Review[];
};

export type MyListItem = {
  _id: string;
  userId: string;
  userEmail: string | null;
  imdbID: string;
  title: string | null;
  poster: string | null;
  year: string | null;
  type: string | null;
  addedAt: string;
};

export type MyListResponse = {
  userId: string;
  count: number;
  items: MyListItem[];
};
