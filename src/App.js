import "./App.css";
import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);
const KEY = "fb6db6d6";

export default function App() {
  const [query, setQuery] = useState("Trial");
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(() => {
    const storedData = localStorage.getItem("watched");
    return JSON.parse(storedData);
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
    setWatched((watched) => [...watched, movie]);
  }
  function handleDeleteWatched(id) {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
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
            `http://www.omdbapi.com/?&apikey=${KEY}&s=${query}`,
            { signal },
          );
          if (!res.ok) throw new Error("Some error happens");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.Search);
        } catch (error) {
          if (error.name !== "AbortError") {
            setErrorMessage(error.message);
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
      <h1>usePopcorn</h1>
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

/*function Box({ element }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && element}
    </div>
  );
}*/

function Box({ element }) {
  return <div className="box">{element}</div>;
}

function MovieList({ movies, loading, errorMessage, handleSelectMovie }) {
  return (
    <>
      {loading && <p>Loading ...</p>}
      {errorMessage && <ErrorMessage errorMessage={errorMessage} />}
      <ul className="list list-movies">
        {movies?.map((movie) => (
          <Movie
            movie={movie}
            key={movie.imdbID}
            handleSelectMovie={handleSelectMovie}
          />
        ))}
      </ul>
    </>
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
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const totalRuntime = watched.reduce((acc, movie) => {
    const runtime = parseInt(movie.runTime);
    if (!isNaN(runtime)) {
      return acc + runtime;
    }
    return acc;
  }, 0);
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(1)}</span>
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
  const [movie, setMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(
    watched.find((movie) => movie.imdbID === selectedId)?.userRating || 0,
  );
  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  const countRef = useRef(0);
  useEffect(() => {
    if (userRating) {
      countRef.current += 1;
      console.log(countRef.current);
    }
  }, [userRating]);

  useEffect(
    function () {
      async function getMovieDetails() {
        if (selectedId) {
          setLoading(true);
          const res = await fetch(
            `http://www.omdbapi.com/?&apikey=${KEY}&i=${selectedId}`,
          );
          const data = await res.json();
          setLoading(false);
          setMovie(data);
        }
      }
      getMovieDetails();
    },
    [selectedId],
  );
  useEffect(
    function () {
      if (!movie.Title) return;
      document.title = `Movie| ${movie.Title}`;
      return function () {
        document.title = "usePopcorn";
      };
    },
    [movie.Title],
  );
  useEffect(function () {
    function handleEscape(e) {
      if (e.code === "Escape") {
        handleCloseMovie();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return function () {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleAddBtn() {
    const newMovie = {
      imdbID: selectedId,
      title: movie.Title,
      year: movie.Year,
      poster: movie.Poster,
      imdbRating: movie.imdbRating,
      runTime:
        movie.Runtime === "N/A" ? 0 : Number(movie.Runtime.split(" ")[0]),
      userRating: userRating,
      decisions: countRef.current,
    };
    handleAddWatch(newMovie);
    handleCloseMovie();
  }
  return (
    <>
      {loading ? (
        <p>Loading ...</p>
      ) : (
        <div className="details">
          <header>
            <button className={"btn-back"} onClick={handleCloseMovie}>
              &larr;
            </button>
            <img src={movie.Poster} alt={movie.Title} />
            <div className="details-overview">
              <h2>{movie.Title}</h2>
              <p>
                {movie.Released} &bull; {movie.Runtime}
              </p>
              <p>{movie.Genre}</p>
              <p>
                <span>⭐</span>
                {movie.imdbRating === "N/A"
                  ? "Not Available"
                  : movie.imdbRating}
              </p>
            </div>
          </header>
          <section>
            {!isWatched ? (
              <div className="rating">
                <StarRating
                  maxRating={10}
                  size={25}
                  userRating={userRating}
                  setUserRating={setUserRating}
                />
              </div>
            ) : (
              <div className="rating">
                You have rated this Movie : {userRating} ⭐️
              </div>
            )}

            {userRating > 5 && !isWatched && (
              <button className="btn-add" onClick={handleAddBtn}>
                + Add to list
              </button>
            )}

            <p>
              <em>{movie.Plot === "N/A" ? "Not Available" : movie.Plot}</em>
            </p>
            <p>
              Sterring :{" "}
              {movie.Actors === "N/A" ? "Not Available" : movie.Actors}
            </p>
            <p>
              Directed by :{" "}
              {movie.Director === "N/A" ? "Not Available" : movie.Director}
            </p>
          </section>
        </div>
      )}
    </>
  );
}

function WatchedMovieList({ watched, handleDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          handleDeleteWatched={handleDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, handleDeleteWatched }) {
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runTime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => handleDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
