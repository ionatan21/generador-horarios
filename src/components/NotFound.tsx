import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./NotFound.css";

const REDIRECT_DELAY = 5;

export default function NotFound() {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(REDIRECT_DELAY);
  const darkMode = localStorage.getItem("darkMode") === "true";

  useEffect(() => {
    if (seconds <= 0) {
      window.location.replace("/");
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <div className={`nf-page${darkMode ? " dark" : ""}`}>
      <div className="nf-card">
        <span className="nf-code">404</span>
        <h1 className="nf-title">{t("notFound.title")}</h1>
        <p className="nf-message">{t("notFound.message")}</p>
        <p className="nf-countdown">
          {t("notFound.countdown", { count: seconds })}
        </p>
        <a className="nf-link" href="/">
          {t("notFound.goNow")}
        </a>
      </div>
    </div>
  );
}
