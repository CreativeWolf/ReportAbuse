// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// --- DOM Elements ---
const dataDisplay = document.getElementById('data-display');
const statusDisplay = document.getElementById('status');
const extractedUrlDisplay = document.getElementById('extracted-url');
const isBitlyDisplay = document.getElementById('is-bitly');
const finalUrlInfoDisplay = document.getElementById('final-url-info');
const domainInfoDisplay = document.getElementById('domain-info');
const reportSection = document.getElementById('report-section');
const reportDomainDisplay = document.getElementById('report-domain');
const reportTweetUrlDisplay = document.getElementById('report-tweet-url');
const reportBitlyUrlDisplay = document.getElementById('report-bitly-url');
const reportFinalUrlDisplay = document.getElementById('report-final-url');


// --- Handle Shared Data ---
window.addEventListener('DOMContentLoaded', () => {
  console.log("DOM Loaded");
  const urlParams = new URLSearchParams(window.location.search);

  const sharedTitle = urlParams.get('title');
  const sharedText = urlParams.get('text');
  const sharedUrl = urlParams.get('url'); // Often the Tweet URL itself

  if (sharedText || sharedUrl) {
    console.log("Shared data found:", { sharedTitle, sharedText, sharedUrl });
    let combinedText = (sharedTitle ? sharedTitle + '\n' : '') +
                       (sharedText ? sharedText + '\n' : '') +
                       (sharedUrl ? sharedUrl : ''); // Use sharedUrl as a fallback if text is empty but url exists
    dataDisplay.textContent = combinedText.trim() || 'No text content shared.';

    // --- Link Extraction Logic ---
    // Simple regex to find URLs (may need refinement for edge cases)
    // Includes common protocols and domain characters. It might pick up email addresses wrongly.
    const urlRegex = /(https?:\/\/[^\s/$.?#].[^\s]*)/gi;
    const urlsFound = combinedText.match(urlRegex);

    if (urlsFound && urlsFound.length > 0) {
      // Prioritize URLs containing t.co (Twitter's shortener) if present,
      // otherwise take the first one found.
      let targetUrl = urlsFound.find(url => url.includes('t.co')) || urlsFound[0];

      extractedUrlDisplay.textContent = targetUrl;
      extractedUrlDisplay.innerHTML = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${targetUrl}</a>`; // Make it clickable

      statusDisplay.textContent = "Link extracted. Manual checks needed.";

      // --- Bit.ly Check ---
      // Note: t.co links often redirect *to* bit.ly or other shorteners.
      // We'll check the *extracted* URL first.
      const isBitly = targetUrl.toLowerCase().includes('bit.ly/');
      isBitlyDisplay.textContent = isBitly ? 'Yes' : 'No (or requires redirect)';

      if (isBitly) {
           finalUrlInfoDisplay.textContent = `This is a bit.ly link. Please click the link above and note the FINAL URL your browser redirects to.`;
           domainInfoDisplay.textContent = `Extract domain manually from the FINAL URL.`;
           // Prepare report section info (placeholders)
           reportSection.style.display = 'block';
           reportTweetUrlDisplay.textContent = sharedUrl || 'N/A';
           reportBitlyUrlDisplay.textContent = targetUrl;
           reportFinalUrlDisplay.textContent = '(Enter manually after visiting link)';
           reportDomainDisplay.textContent = '(Enter manually after visiting link)';
           alert("Bit.ly link found! Please follow the manual steps listed to check and report if necessary.");
      } else if (targetUrl.toLowerCase().includes('t.co/')) {
          finalUrlInfoDisplay.textContent = `This is a Twitter (t.co) link. It will likely redirect. Please click it, follow any redirects (like to bit.ly), and note the FINAL destination URL.`;
          domainInfoDisplay.textContent = `Extract domain manually from the FINAL URL.`;
          // Show report section as it *might* lead to bit.ly -> cloudflare
          reportSection.style.display = 'block';
          reportTweetUrlDisplay.textContent = sharedUrl || 'N/A';
          reportBitlyUrlDisplay.textContent = `(If redirected via Bit.ly: Enter Bit.ly URL here)`;
          reportFinalUrlDisplay.textContent = '(Enter manually after visiting link)';
          reportDomainDisplay.textContent = '(Enter manually after visiting link)';
           alert("Twitter (t.co) link found! It might redirect via Bit.ly or elsewhere. Please follow the manual steps listed to check and report if necessary.");
      }
       else {
          finalUrlInfoDisplay.textContent = `Please click the link above and note the FINAL URL your browser redirects to (if any).`;
          domainInfoDisplay.textContent = `Extract domain manually from the FINAL URL.`;
          // Optionally hide report section if not bitly/t.co? Or always show? Showing for now.
          reportSection.style.display = 'block';
          reportTweetUrlDisplay.textContent = sharedUrl || 'N/A';
          reportBitlyUrlDisplay.textContent = 'N/A (Not directly a Bit.ly link)';
          reportFinalUrlDisplay.textContent = '(Enter manually after visiting link)';
          reportDomainDisplay.textContent = '(Enter manually after visiting link)';
      }

    } else {
      statusDisplay.textContent = "No URL found in the shared content.";
      extractedUrlDisplay.textContent = "N/A";
      isBitlyDisplay.textContent = "N/A";
    }
  } else {
    console.log("No shared data in URL parameters.");
    statusDisplay.textContent = "Ready. Share a Tweet containing a link to this app.";
  }
});
