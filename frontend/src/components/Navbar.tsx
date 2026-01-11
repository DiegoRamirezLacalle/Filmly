type View = "search" | "login" | "signup";

export default function Navbar({
  email,
  onLogout,
  onGoSearch,
  onGoLogin,
  onGoSignup,
  onGoMyList,
}: {
  email: string | null;
  onLogout: () => void;
  onGoSearch: () => void;
  onGoLogin: () => void;
  onGoSignup: () => void;
  onGoMyList: () => void;
}) {
  return (
    <nav className="filmly-navbar">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <button 
            className="filmly-logo btn btn-link p-0" 
            onClick={onGoSearch}
            style={{ background: 'none', border: 'none' }}
          >
            Filmly
          </button>

          <div className="d-flex align-items-center gap-3">
            {email ? (
              <>
                <button className="btn-filmly-link" onClick={onGoMyList}>
                  Mi Lista
                </button>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {email}
                </span>
                <button className="btn btn-filmly-secondary btn-sm" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No autenticado
                </span>
                <button className="btn btn-filmly-primary btn-sm" onClick={onGoLogin}>
                  Login
                </button>
                <button className="btn btn-filmly-primary btn-sm" onClick={onGoSignup}>
                  Signup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

