import { INFO_WRAPPER_REPLACEMENT, ADJUST_LINK, BR_LINK_POOL } from '../constants';

/**
 * Extracts a short 2-word title from a URL slug.
 * Filters out common stop words to make titles more meaningful.
 */
const getShortTitleFromUrl = (url: string): string => {
  try {
    const filename = url.split('/').pop() || '';
    const slug = filename.replace('.html', '');
    // Filter out generic words to get to the "meat" of the slug
    const words = slug.split('-').filter(w => !['prompt', 'prompts', 'ai', 'video', 'photo', 'image', 'generator'].includes(w.toLowerCase()));
    
    // Fallback: if filtering removed everything, use the original slug parts
    const finalWords = words.length >= 1 ? words : slug.split('-');

    // Take max 2 words and capitalize them
    return finalWords.slice(0, 2)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch (e) {
    return "Veja Mais";
  }
};

/**
 * Updates the title of a link element without destroying other children (like images).
 */
const updateLinkTitle = (link: HTMLAnchorElement, newTitle: string) => {
  // 1. Card Style: Look for an <h5> tag inside the link (common in .box-style)
  const h5 = link.querySelector('h5');
  if (h5) {
    h5.textContent = newTitle;
    return;
  }

  // 2. Button Style: If it's a category button (usually text only), update text directly.
  // We use classList check to be safe.
  if (link.classList.contains('category-btn')) {
    link.textContent = newTitle;
    return;
  }

  // 3. Fallback Header: Look for other common header tags
  const header = link.querySelector('h3, h4, .title');
  if (header) {
    header.textContent = newTitle;
    return;
  }

  // CRITICAL: If no specific text container is found, DO NOT replace innerHTML/textContent.
  // This preserves images and complex structures inside the link.
};

/**
 * Main processing function
 */
export const processHtmlContent = (rawHtml: string): string => {
  const parser = new DOMParser();
  // Parse as HTML. 
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // --- Rule 1: Replace .info-wrapper content ---
  const infoWrappers = doc.querySelectorAll('.info-wrapper');
  infoWrappers.forEach(wrapper => {
    wrapper.innerHTML = INFO_WRAPPER_REPLACEMENT;
  });

  // --- Rule 4 & 5: Link Handling ---
  const allLinks = Array.from(doc.querySelectorAll('a'));
  let poolIndex = 0;

  allLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const lowerHref = href.toLowerCase();

    // 1. Adjust / Go.link Replacement
    if (lowerHref.includes('.go.link') || lowerHref.includes('adjust.com')) {
      link.setAttribute('href', ADJUST_LINK);
      return; 
    }

    // 2. Internal Filmora English Links Handling
    // We target links containing 'filmora.wondershare.com' but NOT '.br'
    const isEnglishInternal = lowerHref.includes('filmora.wondershare.com') && !lowerHref.includes('.br');

    if (isEnglishInternal) {
      // Determine context: Is it a Card/Slider (needs swap) or Body Text (needs delete)?
      
      const isSwiper = link.closest('.swiper-slide');
      // Check for card classes or parents
      const isCard = link.classList.contains('box-style') || link.closest('.box-style') || link.closest('.col');

      if (isSwiper || isCard) {
        // --- Rule 5: Swap Link & Title ---
        const nextLink = BR_LINK_POOL[poolIndex % BR_LINK_POOL.length];
        poolIndex++;

        // Ensure https protocol
        const fullUrl = nextLink.startsWith('http') ? nextLink : `https://${nextLink}`;
        link.setAttribute('href', fullUrl);
        
        // Update Title (preserving structure)
        const newTitle = getShortTitleFromUrl(fullUrl);
        updateLinkTitle(link, newTitle);

      } else {
        // --- Rule 4: Delete (Unwrap) Body Links & Remove <u> tags inside them ---
        // Exception: Do not unwrap "Buttons" (like download buttons)
        const isBtn = link.classList.contains('btn');
        
        if (!isBtn) {
           const parent = link.parentNode;
           if (parent) {
             // Iterate through all children of the link to unwrap them
             while (link.firstChild) {
               const child = link.firstChild;
               
               // Check if the child is a <u> tag
               // The user wants to remove the <u> tag as well if it's wrapping the text inside the link.
               if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toUpperCase() === 'U') {
                  const uTag = child as HTMLElement;
                  // Unwrap the <u> tag: move its children (the text) to the parent of the <a>
                  while (uTag.firstChild) {
                    parent.insertBefore(uTag.firstChild, link);
                  }
                  // Remove the empty <u> tag from the <a> so the loop advances
                  link.removeChild(uTag);
               } else {
                 // If it's not a <u> tag, just move it out to the parent directly
                 parent.insertBefore(child, link);
               }
             }
             // Finally, remove the empty <a> tag
             parent.removeChild(link);
           }
        }
      }
    }
  });

  // --- Rule 3 Part B: Strong Tag Limit ---
  // Keep first 5 <strong>, convert rest to <b>
  const strongTags = Array.from(doc.querySelectorAll('strong'));
  strongTags.forEach((strong, index) => {
    if (index >= 5) {
      const bold = doc.createElement('b');
      bold.innerHTML = strong.innerHTML;
      strong.parentNode?.replaceChild(bold, strong);
    }
  });

  // Serialize for Regex operations
  // Note: doc.body.innerHTML gives the content inside body. 
  // If the input was a full document, this is fine. If it was a fragment, DOMParser wraps it in body.
  let processedString = doc.body.innerHTML;

  // --- Rule 3 Part A: Spacing ---
  // Add space before <a or <strong> if preceded by a non-space/non-tag character
  processedString = processedString.replace(/([^\s>])(<a\b|<strong\b)/gi, '$1 $2');
  
  // Add space after </a> or </strong> if followed by a non-space/non-punctuation character
  // Allowed punctuation that doesn't need space: . , : ; ! ? < (start of next tag)
  processedString = processedString.replace(/(<\/a>|<\/strong>)([^.,:;!?\s<])/gi, '$1 $2');


  // --- Rule 6: Comment out "Gemini 100 dicas" and "Nano Banana Pro" blocks ---
  // We look for the specific structure: div > a > u > text
  // Using a robust regex to catch the wrapper div. 
  // Matches class="pt-3" AND style containing "text-align: center".
  const promoPattern = /<div[^>]*class="[^"]*pt-3[^"]*"[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>[\s\S]*?(?:Gemini|Nano Banana)[\s\S]*?<\/div>/gi;
  
  processedString = processedString.replace(promoPattern, (match) => {
    // Avoid double commenting if run multiple times or if manually added
    if (match.trim().startsWith('<!--')) return match;
    return `<!-- ${match} -->`;
  });

  // Clean up any double comments just in case
  processedString = processedString.replace(/<!--\s*<!--/g, '<!--').replace(/-->\s*-->/g, '-->');

  return processedString;
};