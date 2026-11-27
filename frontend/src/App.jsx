import AuthScreen from "./components/auth/AuthScreen";
import Brand from "./components/common/Brand";
import AppLayout from "./components/layout/AppLayout";
import useAuth from "./hooks/useAuth";
import "./App.css";
import "./theme.css";

export default function App() {
  const auth = useAuth();

  if (auth.user === undefined) {
    return <div className="boot-screen"><Brand /><span className="spinner" /></div>;
  }
  if (!auth.user) return <AuthScreen onAuthenticated={auth.setUser} />;

  return <AppLayout user={auth.user} onLogout={auth.signOut} error={auth.error} onError={auth.handleError} onDismissError={() => auth.setError(null)} />;
}
