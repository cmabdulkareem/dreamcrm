import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({ title, description }) => {
  const pageTitle = title ? `${title} | Dream CRM` : "Dream CRM";
  const ogDescription = description || "Join us for our upcoming events and stay connected.";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={ogDescription} />
    </Helmet>
  );
};

export const AppWrapper = ({ children }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
