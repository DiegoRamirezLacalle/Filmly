import { MongoClient } from 'mongodb';
import axios from 'axios';

const OMDB_API_KEY = process.env.OMDB_API_KEY || 'aff72a2f';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

// Películas populares por IMDb ID para indexar con datos completos
const POPULAR_MOVIES = [
  // Tarantino
  'tt0110912', // Pulp Fiction
  'tt0266697', // Kill Bill Vol 1
  'tt0378194', // Kill Bill Vol 2
  'tt0116367', // Jackie Brown
  'tt0105236', // Reservoir Dogs
  'tt1853728', // Django Unchained
  'tt0361748', // Inglourious Basterds
  'tt3460252', // The Hateful Eight
  'tt7131622', // Once Upon a Time in Hollywood
  
  // Nolan
  'tt0468569', // The Dark Knight
  'tt1375666', // Inception
  'tt0816692', // Interstellar
  'tt0482571', // The Prestige
  'tt0209144', // Memento
  'tt0634240', // Batman Begins
  'tt1345836', // The Dark Knight Rises
  'tt6723592', // Tenet
  'tt4513678', // Dunkirk
  'tt13320622', // Oppenheimer
  
  // DiCaprio
  'tt0993846', // The Wolf of Wall Street
  'tt0407887', // The Departed
  'tt1130884', // Shutter Island
  'tt0407887', // The Departed
  'tt1663662', // The Revenant
  'tt0364569', // Catch Me If You Can
  'tt0338013', // Eternal Sunshine of the Spotless Mind
  'tt0120338', // Titanic
  
  // Scorsese
  'tt0070735', // The Godfather
  'tt0099685', // Goodfellas
  'tt0075314', // Taxi Driver
  'tt0103064', // Cape Fear
  'tt0119094', // The Big Lebowski
  'tt0477348', // No Country for Old Men
  
  // Otros clásicos
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0071562', // The Godfather Part II
  'tt0108052', // Schindler's List
  'tt0167260', // The Lord of the Rings: The Return of the King
  'tt0137523', // Fight Club
  'tt0109830', // Forrest Gump
  'tt0073486', // One Flew Over the Cuckoo's Nest
  'tt0099685', // Goodfellas
  'tt0133093', // The Matrix
];

async function fetchMovieDetails(imdbID) {
  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        i: imdbID,
        apikey: OMDB_API_KEY,
        plot: 'full',
      },
    });

    if (response.data.Response === 'False') {
      console.log(`❌ Movie not found: ${imdbID}`);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${imdbID}:`, error.message);
    return null;
  }
}

async function seedPopularMovies() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('filmly');
    const collection = db.collection('movies_cache');

    let indexed = 0;
    let skipped = 0;

    for (const imdbID of POPULAR_MOVIES) {
      const existing = await collection.findOne({ imdbID });
      
      if (existing) {
        console.log(`⏭️  Skipping ${imdbID} (already exists)`);
        skipped++;
        continue;
      }

      const movie = await fetchMovieDetails(imdbID);
      
      if (movie) {
        await collection.insertOne(movie);
        console.log(`✅ Indexed: ${movie.Title} (${movie.Year}) - Dir: ${movie.Director}`);
        indexed++;
        
        // Delay para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Indexed: ${indexed}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${POPULAR_MOVIES.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

seedPopularMovies();
