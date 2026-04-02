import { SUPPORT_PAGES } from "./SupportPage";

export default function SiteFooter({ onOpenSupportPage }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-links">
        {Object.entries(SUPPORT_PAGES).map(([id, page]) => (
          <a
            key={page.route}
            href={page.route}
            className="site-footer-link"
            onClick={(event) => {
              event.preventDefault();
              onOpenSupportPage?.(id);
            }}
          >
            {page.linkLabel || page.heading}
          </a>
        ))}
      </div>
    </footer>
  );
}
