import { HelmetProvider, Helmet } from "react-helmet-async";

const PageMeta = ({ title, description, image, url }) => {
  const pageTitle = title ? `${title} | Dream CRM` : "Dream CRM";
  const ogTitle = title || "Social Media Sharing | Dream CRM";
  const ogDescription = description || "Join us for our upcoming events and stay connected.";
  const siteUrl = url || window.location.href;

  // Ensure image is an absolute URL
  let fullImageUrl = image;
  if (image && !image.startsWith('http')) {
    fullImageUrl = `${window.location.origin}${image.startsWith('/') ? '' : '/'}${image}`;
  } else if (!image) {
    // Default image if none provided
    fullImageUrl = `${window.location.origin}/favicon.png`;
  }

  return (
    <Helmet>
      {/* Search Engine */}
      <title>{pageTitle}</title>
      <meta name="description" content={ogDescription} />
      <meta name="image" content={fullImageUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="Dream CRM" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={siteUrl} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@dreamcrm" />
    </Helmet>
  );
};

export const AppWrapper = ({ children }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
