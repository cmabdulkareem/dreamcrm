import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({ title, description, image, url }) => {
  const pageTitle = title ? `${title} | Dream CRM` : "Dream CRM";
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url || window.location.href} />
      <meta property="og:title" content={title || "Dream CRM"} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url || window.location.href} />
      <meta name="twitter:title" content={title || "Dream CRM"} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export const AppWrapper = ({ children }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
