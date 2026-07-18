import { useNavigate } from "react-router-dom";

export default function Topbar({ children }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-300 flex items-center justify-center text-xl shadow-soft">
          🥗
        </div>
        <span className="text-lg font-bold text-ink">Plate Correct AI</span>
      </div>
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}
