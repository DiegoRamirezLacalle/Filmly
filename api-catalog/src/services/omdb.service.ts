import axios from "axios";

const OMDB_URL = "http://www.omdbapi.com/";
const API_KEY = process.env.OMDB_API_KEY!;

export async function searchMovieByTitle(title: string) {
  const response = await axios.get(OMDB_URL, {
    params: {
      t: title,
      apikey: API_KEY,
      plot: "full", // opcional pero recomendable para tener más info
    },
  });

  if (response.data.Response === "False") {
    return null;
  }

  return response.data;
}

export async function searchMovieByImdbID(imdbID: string) {
  const response = await axios.get(OMDB_URL, {
    params: {
      i: imdbID,
      apikey: API_KEY,
      plot: "full",
    },
  });

  if (response.data.Response === "False") {
    return null;
  }

  return response.data;
}

export async function searchMoviesByQuery(q: string, page: number = 1, type?: "movie" | "series" | "episode")
 {
  const response = await axios.get(OMDB_URL, {
    params: {
      s: q,
      page,
      type: type || undefined,
      apikey: API_KEY,
    },
  });

  if (response.data.Response === "False") {
    return {
      totalResults: 0,
      Search: [],
    };
  }

  return {
    totalResults: Number(response.data.totalResults || 0),
    Search: Array.isArray(response.data.Search) ? response.data.Search : [],
  };
}
