import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Api } from "../api/client";
import Spinner from "../components/Spinner";

const FALLBACK_FORM_URL = "https://form.typeform.com/to/c8xblE4k";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [patientId, setPatientId] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formUrl, setFormUrl] = useState(FALLBACK_FORM_URL);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    Api.getRegistrationConfig()
      .then((res) => setFormUrl(res.registration_form_url))
      .catch(() => {});
  }, []);

  const validate = () => {
    const next = {};
    if (!patientId.trim()) next.patientId = "Enter your Patient ID";
    if (!fullName.trim()) next.fullName = "Enter your full name";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login(patientId.trim(), fullName.trim());
      navigate("/dashboard");
    } catch (err) {
      setAlert(
        err.status === 404
          ? "We couldn't find a matching patient record. Please double-check your details, or register below if you're new."
          : err.message || "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    window.open(formUrl, "_blank", "noopener,noreferrer");
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-soft">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.8" fill="none"/>
              <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.4" fill="none"/>
              <path d="M17 4v3.5a2 2 0 01-2 2v10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-ink dark:text-gray-100">Plate Correct AI</span>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-center mb-1">Patient Login</h2>
          <p className="text-sm text-muted text-center mb-6">
            Enter your Patient ID and full name to continue
          </p>

          {alert && (
            <div className="bg-red-50 text-danger text-sm rounded-xl px-4 py-3 mb-4 animate-fadeInUp">
              {alert}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="field-label" htmlFor="patientId">Patient ID</label>
              <input
                id="patientId"
                type="text"
                className={`field-input ${errors.patientId ? "border-danger" : ""}`}
                placeholder="e.g. P004"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              <div className="error-text">{errors.patientId}</div>
            </div>

            <div className="mb-2">
              <label className="field-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className={`field-input ${errors.fullName ? "border-danger" : ""}`}
                placeholder="As entered during registration"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <div className="error-text">{errors.fullName}</div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2" disabled={submitting}>
              {submitting ? <Spinner /> : "Log In"}
            </button>
          </form>

          <div className="text-center text-sm text-muted mt-4">
            New patient?{" "}
            <a href={formUrl} onClick={handleRegisterClick} className="text-primary font-semibold hover:underline">
              Register here
            </a>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-ink/45 flex items-center justify-center p-5 z-50 animate-fadeInUp"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-[#201714] rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold mb-2">Thanks for registering!</h3>
            <p className="text-sm text-muted leading-relaxed mb-6">
              We've opened the registration form in a new tab. Please fill it in with your details —
              once it's submitted, your record will be added to our patient list and you'll be able to
              log in here using the Patient ID and Full Name you provided.
            </p>
            <button className="btn btn-primary w-full" onClick={() => setShowModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

