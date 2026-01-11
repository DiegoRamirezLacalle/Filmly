import { useState } from "react";
import { api } from "../services/api";

export default function SignupPage({
  onAuth,
  onCancel,
}: {
  onAuth: (email: string) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email || !password || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/users/signup", { email, password });

      localStorage.setItem("filmly_token", res.data.access_token);
      localStorage.setItem("filmly_email", res.data.user.email);

      onAuth(res.data.user.email);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Error creando usuario";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="movie-detail-container">
        <div className="text-center mb-4">
          <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Crear Cuenta</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Únete a la comunidad de Filmly</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            className="form-control form-control-lg"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Contraseña</label>
          <input
            className="form-control form-control-lg"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            La contraseña debe tener al menos 6 caracteres
          </small>
        </div>

        <div className="d-grid gap-2">
          <button 
            className="btn btn-filmly-primary btn-lg" 
            onClick={submit} 
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creando...
              </>
            ) : (
              "Crear cuenta"
            )}
          </button>

          <button 
            className="btn btn-filmly-secondary" 
            onClick={onCancel} 
            disabled={loading}
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}
