import { api } from "./api";
import type { Review, ReviewsResponse, MyListItem, MyListResponse } from "../types/movies";

export type ElasticHit = {
  id: string;
  score: number;
  movie: any;
};

export async function searchElastic(q: string) {
  const { data } = await api.get(`/api/movies/search-es`, { params: { q } });
  return data as { q: string; count: number; hits: ElasticHit[] };
}

export async function getMovieByTitle(title: string) {
  const { data } = await api.get(`/api/movies/search`, { params: { title } });
  return data as { source: "cache" | "omdb"; movie: any };
}

export async function getMovieByImdbID(imdbID: string) {
  const { data } = await api.get(`/api/movies/detail`, { params: { imdbID } });
  return data as { source: "cache" | "omdb"; movie: any };
}

// Reviews
export async function getReviewsByMovie(imdbID: string): Promise<ReviewsResponse> {
  const { data } = await api.get(`/api/reviews`, { params: { imdbID } });
  return data;
}

export async function createOrUpdateReview(payload: {
  imdbID: string;
  rating: number;
  text: string;
}): Promise<{ ok: boolean; review: Review }> {
  const { data } = await api.post(`/api/reviews`, payload);
  return data;
}

// My List
export async function getMyList(): Promise<MyListResponse> {
  const { data } = await api.get(`/api/mylist/me`);
  return data;
}

export async function addToMyList(payload: {
  imdbID: string;
  title?: string;
  poster?: string;
  year?: string;
  type?: string;
}): Promise<{ ok: boolean; item: MyListItem }> {
  const { data } = await api.post(`/api/mylist`, payload);
  return data;
}

export async function removeFromMyList(imdbID: string): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.delete(`/api/mylist/${imdbID}`);
  return data;
}

export async function checkInMyList(imdbID: string): Promise<{ inList: boolean }> {
  const { data } = await api.get(`/api/mylist/check/${imdbID}`);
  return data;
}
