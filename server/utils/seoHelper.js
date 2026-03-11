/**
 * Utility to inject SEO metadata and initial data into the HTML template.
 * Supports both 'event' and 'job' types.
 */
export const generateSEOHtml = (originalHtml, data, type = 'event', isDev = false) => {
  let title = "Dream CRM";
  let description = "Streamline Your Business with CDC International.";
  let url = "https://crm.cdcinternational.in";
  let imageUrl = "";
  let hydrationKey = "window.__INITIAL_EVENT_DATA__";

  if (data) {
    if (type === 'event') {
      title = `${data.eventName} | Dream CRM`;
      description = data.eventDescription || "Register for this event";
      url = `https://crm.cdcinternational.in/event-registration/${data.registrationLink}`;
      hydrationKey = "window.__INITIAL_EVENT_DATA__";
      
      if (data.bannerImage) {
        imageUrl = data.bannerImage.startsWith('http') 
          ? data.bannerImage 
          : `https://crm.cdcinternational.in${data.bannerImage.startsWith('/') ? '' : '/'}${data.bannerImage}`;
      }
    } else if (type === 'job') {
      title = `${data.title} | ${data.brand} Careers`;
      description = data.description ? data.description.substring(0, 160) : `Apply for the ${data.title} position at ${data.brand}.`;
      url = `https://crm.cdcinternational.in/jobs/apply/${data._id}`;
      hydrationKey = "window.__INITIAL_JOB_DATA__";
      
      imageUrl = "https://crm.cdcinternational.in/images/logo/logo.svg";
    }
  }

  let html = originalHtml;

  // 1. Inject/Replace Meta Tags
  if (html.includes('<title>')) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  } else {
    html = html.replace(/<\/head>/i, `<title>${title}</title>\n</head>`);
  }
  
  if (html.includes('<meta name="description"')) {
    html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${description}" />`);
  } else {
    html = html.replace(/<\/head>/i, `<meta name="description" content="${description}" />\n</head>`);
  }

  // 2. Inject Social Meta Tags (OG, Twitter)
  const socialMeta = `
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ""}

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${url}" />
  <meta property="twitter:title" content="${title}" />
  <meta property="twitter:description" content="${description}" />
  ${imageUrl ? `<meta property="twitter:image" content="${imageUrl}" />` : ""}
  `;

  html = html.replace(/<\/head>/i, `${socialMeta}\n</head>`);

  // 3. Inject Initial Data for Hydration
  if (data) {
    const dataScript = `
  <script>
    ${hydrationKey} = ${JSON.stringify(data)};
  </script>
    `;
    html = html.replace(/<\/head>/i, `${dataScript}\n</head>`);
  }

  // 4. Development Mode fixes (Vite Port 5173)
  if (isDev) {
    // Rewrite all root-relative paths to point to Vite (manifest, favicon, src, etc)
    html = html.replace(/(href|src|from|import) (["'])\/(?!https?:\/\/|data:)/g, `$1 $2http://localhost:5173/`);
    html = html.replace(/(href|src|from|import)=(['"])\/(?!https?:\/\/|data:)/g, `$1=$2http://localhost:5173/`);

    if (!html.includes('__vite_plugin_react_preamble_installed__')) {
       const devPreamble = `
  <script type="module">
    import RefreshRuntime from "http://localhost:5173/@react-refresh"
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <script type="module" src="http://localhost:5173/@vite/client"></script>
       `;
       html = html.replace(/<\/head>/i, `${devPreamble}\n</head>`);
    }
  }

  return html;
};
