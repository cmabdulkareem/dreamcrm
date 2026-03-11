/**
 * Utility to inject SEO metadata and initial data into the HTML template.
 * Supports both 'event' and 'job' types.
 */
export const generateSEOHtml = (originalHtml, data, type = 'event', isDev = false) => {
  let title = "CDC International";
  let description = "Streamline Your Business with CDC International.";
  let url = "https://crm.cdcinternational.in";
  let imageUrl = "";
  let hydrationKey = "window.__INITIAL_EVENT_DATA__";

  if (data) {
    if (type === 'event') {
      title = `${data.eventName} | CDC International`;
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
    } else if (type === 'attendance') {
      title = `${data.batch?.batchName || 'Attendance Report'} | CDC International`;
      description = `View attendance report for ${data.batch?.batchName || 'your batch'}.`;
      hydrationKey = "window.__INITIAL_ATTENDANCE_DATA__";
      imageUrl = "https://crm.cdcinternational.in/images/logo/logo.svg";
    } else if (type === 'onboarding') {
      title = `Onboarding Acceptance: ${data.fullName} | CDC International`;
      description = `Onboarding and Agreement Acceptance for ${data.fullName}.`;
      hydrationKey = "window.__INITIAL_ONBOARDING_DATA__";
      imageUrl = "https://crm.cdcinternational.in/images/logo/logo.svg";
    } else if (type === 'agreement') {
      title = `Agreement Verification | Dream CRM`;
      description = `Verify the authenticity of a digital agreement issued by CDC International.`;
      hydrationKey = "window.__INITIAL_VERIFICATION_DATA__";
      imageUrl = "https://crm.cdcinternational.in/images/logo/logo.svg";
    }
  }

  let html = originalHtml;

  // Function to replace or inject tags
  const replaceOrInject = (regex, newTag, fallbackRegex) => {
    if (regex.test(html)) {
      html = html.replace(regex, newTag);
    } else if (fallbackRegex && fallbackRegex.test(html)) {
      html = html.replace(fallbackRegex, (match) => `${newTag}\n${match}`);
    } else {
      html = html.replace(/<\/head>/i, `${newTag}\n</head>`);
    }
  };

  // 1. Handle Title (Replace existing or inject before </head>)
  // Added [\s\S]*? to handle newlines
  replaceOrInject(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`, /<\/head>/i);
  
  // 2. Handle Description (Replace existing or inject before </head>)
  // More robust regex for meta tags which can have attributes in different orders
  if (/<meta[^>]*name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta[^>]*name=["']description["'][^>]*content=["'][\s\S]*?["'][^>]*>/i, `<meta name="description" content="${description}" />`);
    html = html.replace(/<meta[^>]*content=["'][\s\S]*?["'][^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${description}" />`);
  } else {
    html = html.replace(/<\/head>/i, `<meta name="description" content="${description}" />\n</head>`);
  }

  // 3. Inject Social Meta Tags (OG, Twitter)
  // To avoid duplicates, we'll remove existing OG/Twitter tags for these properties first
  const clearSocialTags = (prop) => {
    const ogRegex = new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*>`, 'gi');
    const twRegex = new RegExp(`<meta[^>]*name=["']twitter:${prop}["'][^>]*>`, 'gi');
    const twUrlRegex = new RegExp(`<meta[^>]*property=["']twitter:${prop}["'][^>]*>`, 'gi');
    html = html.replace(ogRegex, '').replace(twRegex, '').replace(twUrlRegex, '');
  };

  ['url', 'title', 'description', 'image', 'type'].forEach(clearSocialTags);

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
