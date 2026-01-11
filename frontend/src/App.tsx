import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MyListPage from "./pages/MyListPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import "./App.css";

type View = "search" | "login" | "signup" | "mylist" | "detail";

export default function App() {
  const [email, setEmail] = useState<string | null>(null);
  const [view, setView] = useState<View>("search");
  const [selectedImdbID, setSelectedImdbID] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem("filmly_email");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  function onAuth(e: string) {
    setEmail(e);
    setView("search");
  }

  function logout() {
    localStorage.removeItem("filmly_token");
    localStorage.removeItem("filmly_email");
    setEmail(null);
    setView("search");
  }

  function goToDetail(imdbID: string) {
    setSelectedImdbID(imdbID);
    setView("detail");
  }

  function goBack() {
    setView("search");
  }

  return (
    <>
      <Navbar
        email={email}
        onLogout={logout}
        onGoSearch={() => setView("search")}
        onGoLogin={() => setView("login")}
        onGoSignup={() => setView("signup")}
        onGoMyList={() => setView("mylist")}
      />

      {view === "search" && <SearchPage onOpenDetail={goToDetail} />}
      {view === "login" && <LoginPage onAuth={onAuth} onCancel={() => setView("search")} />}
      {view === "signup" && <SignupPage onAuth={onAuth} onCancel={() => setView("search")} />}
      {view === "mylist" && <MyListPage onGoLogin={() => setView("login")} onOpenDetail={goToDetail} />}
      {view === "detail" && selectedImdbID && (
        <MovieDetailPage
          imdbID={selectedImdbID}
          onBack={goBack}
          onGoLogin={() => setView("login")}
        />
      )}
    </>
  );
}
