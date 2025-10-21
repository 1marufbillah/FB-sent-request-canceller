(async function cancelAllSentRequests({delay = 1200, maxAttempts = 3} = {}) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function waitFor(selector, timeout = 3000, poll = 200) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await sleep(poll);
    }
    return null;
  }

  function findCancelButtons() {
    const candidates = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"], div[role="button"]'));
    const matches = candidates.filter(el => {
      const txt = (el.innerText || el.textContent || '').trim();
      return /^(Cancel request|Cancel|Withdraw request|Withdraw|Requested|Requested·|Requested$)/i.test(txt);
    });
    return matches.filter((el, i, arr) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && arr.indexOf(el) === i;
    });
  }

  async function clickAndConfirm(btn) {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const clickable = btn.closest('button, [role="button"], a[role="button"], div[role="button"]') || btn;
    clickable.scrollIntoView({behavior: 'smooth', block: 'center'});
    clickable.click();

    const dialogSelectors = ['[role="dialog"]', '.uiLayer', 'div[aria-modal="true"]'];
    let confirmFound = false;
    for (const sel of dialogSelectors) {
      const dialog = await waitFor(sel, 1800, 200);
      if (!dialog) continue;
      const buttons = Array.from(dialog.querySelectorAll('button, [role="button"], a[role="button"]'));
      for (const b of buttons) {
        const t = (b.innerText || b.textContent || '').trim();
        if (/^(Cancel Request|Withdraw|Withdraw Request|Confirm|OK|Yes|Remove Request|Remove)/i.test(t)) {
          b.click();
          confirmFound = true;
          break;
        }
      }
      if (confirmFound) break;
    }

    if (!confirmFound) {
      const fallback = Array.from(document.querySelectorAll('button, [role="button"], a[role="button"]'))
        .find(b => /^(Cancel Request|Withdraw|Withdraw Request|Confirm|Remove Request|Remove)/i.test((b.innerText||b.textContent||'').trim()));
      if (fallback) {
        fallback.click();
        confirmFound = true;
      }
    }

    return confirmFound;
  }

  try {
    window.scrollTo({top: 0, behavior: 'auto'});
    await sleep(600);

    let cancels = findCancelButtons();
    if (!cancels.length) {
      alert('⚠️ No cancel buttons found! Make sure you’re on the Sent Requests page.');
      return;
    }

    alert(`✅ Found ${cancels.length} requests. Starting to cancel...`);
    let index = 0;

    while (true) {
      const buttons = findCancelButtons();
      if (!buttons.length) break;
      const btn = buttons[0];
      index++;
      await clickAndConfirm(btn);
      await sleep(delay);
      window.scrollBy({top: 300, behavior: 'smooth'});
      await sleep(400);
    }

    alert(`🎉 Done! Processed ${index} requests.`);
  } catch (err) {
    console.error('Error running cancelAllSentRequests:', err);
    alert('❌ Error: ' + err.message);
  }
})();