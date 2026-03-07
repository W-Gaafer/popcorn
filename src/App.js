import "./App.css";
import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = "d87c789bea0730034d2f9f6633d26bd8";
const IMG_URL = "https://image.tmdb.org/t/p/w500";

export default function App() {
  const [query, setQuery] = useState("Trial");
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(() => {
    try {
      const storedData = localStorage.getItem("watched");
      const parsed = storedData ? JSON.parse(storedData) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  function handleSelectMovie(id) {
    setSelectedId(selectedId === id ? null : id);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatch(movie) {
    setWatched((prev) => [...prev, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((prev) => prev.filter((m) => m.id !== id));
  }

  useEffect(() => {
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    async function movieFetch() {
      if (query === "") {
        setMovies([]);
        setLoading(false);
        setErrorMessage("");
      } else {
        try {
          setLoading(true);
          setErrorMessage("");
          const res = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`,
            { signal: controller.signal },
          );
          if (!res.ok) throw new Error("Some error happens");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.results || []);
        } catch (error) {
          if (error.name !== "AbortError") {
            setErrorMessage("Error fetching movies");
            setMovies([]);
          }
        } finally {
          setLoading(false);
        }
      }
    }
    handleCloseMovie();
    movieFetch();
    return function () {
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box
          element={
            <MovieList
              movies={movies}
              loading={loading}
              errorMessage={errorMessage}
              handleSelectMovie={handleSelectMovie}
            />
          }
        />
        <Box
          element={
            selectedId ? (
              <MovieDetails
                selectedId={selectedId}
                handleCloseMovie={handleCloseMovie}
                handleAddWatch={handleAddWatch}
                watched={watched}
              />
            ) : (
              <>
                <WatchedSummery watched={watched} />
                <WatchedMovieList
                  watched={watched}
                  handleDeleteWatched={handleDeleteWatched}
                />
              </>
            )
          }
        />
      </Main>
    </>
  );
}

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

//محصلش مقارنة لـ ErrorMessage
function ErrorMessage({ errorMessage }) {
  return (
    <>
      <p>{errorMessage}</p>
    </>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>Popcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);
  useEffect(() => {
    function callFunction(e) {
      if (document.activeElement === inputEl.current) {
        return;
      }
      if (e.code === "Enter") {
        inputEl.current.focus();
        setQuery("");
      }
    }
    document.addEventListener("keydown", (e) => callFunction(e));
    return document.removeEventListener("keydown", (e) => callFunction(e));
  }, []);
  return (
    <input
      ref={inputEl}
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies?.length || 0}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ element }) {
  return <div className="box">{element}</div>;
}

function MovieList({ movies, loading, errorMessage, handleSelectMovie }) {
  if (loading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <ul className="list list-movies">
      {movies.map((movie) => (
        <li key={movie.id} onClick={() => handleSelectMovie(movie.id)}>
          <img
            src={
              movie.poster_path
                ? IMG_URL + movie.poster_path
                : "https://via.placeholder.com/100x150"
            }
            alt={movie.title}
          />
          <h3>{movie.title}</h3>
          <p>{movie.release_date?.slice(0, 4)}</p>
        </li>
      ))}
    </ul>
  );
}

function Movie({ movie, handleSelectMovie }) {
  return (
    <li onClick={() => handleSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedSummery({ watched }) {
  const avgRating = average((watched ?? []).map((m) => m.vote_average));
  const avgUser = average((watched ?? []).map((m) => m.userRating));
  const totalRuntime = (watched ?? []).reduce((acc, m) => acc + m.runtime, 0);

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{(watched ?? []).length} movies</span>
        </p>
        <p>
          <span>⭐</span>
          <span>{avgRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUser.toFixed(1)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{totalRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function MovieDetails({
  selectedId,
  handleCloseMovie,
  handleAddWatch,
  watched,
}) {
  const [movie, setMovie] = useState(null);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    async function fetchDetails() {
      const res = await fetch(
        `${BASE_URL}/movie/${selectedId}?api_key=${API_KEY}`,
      );
      const data = await res.json();
      setMovie(data);
    }

    fetchDetails();
  }, [selectedId]);

  if (!movie) return <p>Loading...</p>;

  function handleAdd() {
    handleAddWatch({
      id: movie.id,
      title: movie.title,
      poster: IMG_URL + movie.poster_path,
      vote_average: movie.vote_average,
      runtime: movie.runtime || 0,
      userRating,
    });

    handleCloseMovie();
  }

  return (
    <div className="details">
      <img src={IMG_URL + movie.poster_path} alt={movie.title} />

      <h2>{movie.title}</h2>

      <p>{movie.overview}</p>

      <p>📅 {movie.release_date}</p>
      <p>⏱ {movie.runtime} min</p>
      <p>⭐ {movie.vote_average}</p>

      <StarRating
        maxRating={10}
        userRating={userRating}
        setUserRating={setUserRating}
      />

      {userRating > 0 && (
        <button className="btn-add" onClick={handleAdd}>
          + Add to list
        </button>
      )}

      <button className="btn-back" onClick={handleCloseMovie}>
        ← Back
      </button>
    </div>
  );
}

function WatchedMovieList({ watched, handleDeleteWatched }) {
  return (
    <ul className="list list-watched">
      {(watched ?? []).map((movie) => (
        <li key={movie.id}>
          <img src={movie.poster} alt={movie.title} />

          <div className="movie-info">
            <h3>{movie.title}</h3>

            <p>
              <span>⭐</span>
              <span>{movie.vote_average}</span>
            </p>

            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>

            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>
          </div>

          <button
            className="btn-delete"
            onClick={() => handleDeleteWatched(movie.id)}
          >
            X
          </button>
        </li>
      ))}
    </ul>
  );
}
