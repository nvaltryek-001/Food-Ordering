"""
Records the FoodSense demo video (docs/demo/foodsense-demo.mp4).

Requirements: a running FoodSense server on http://localhost:5000 (freshly seeded),
Python Playwright (`pip install playwright && playwright install chromium`) and ffmpeg.

    python scripts/demo/record_demo.py

Three clips are recorded and stitched together:
  1. A diner: landing page → table QR → menu → dish → cart → checkout → live tracking
  2. Side by side: the kitchen board moving the ticket while the diner's page updates live,
     then the diner rating a dish
  3. The admin dashboard: analytics, menu control and printable table QR codes
"""
import asyncio
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("DEMO_URL", "http://localhost:5000")
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "demo"
CHROME = os.environ.get("CHROME_PATH")  # optional: use a system Chrome

# A visible cursor and caption overlay — headless recordings show neither by default.
OVERLAY_JS = r"""
(() => {
  const ready = () => {
    if (document.getElementById('__demo_cursor')) return;
    const c = document.createElement('div');
    c.id = '__demo_cursor';
    c.style.cssText = 'position:fixed;z-index:2147483647;left:-40px;top:-40px;width:22px;height:22px;pointer-events:none;transition:transform .12s;';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 10-6.5 1.3L9.4 20z" fill="#0f2f22" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    addEventListener('mousemove', e => { c.style.left = e.clientX - 3 + 'px'; c.style.top = e.clientY - 2 + 'px'; }, true);
    addEventListener('mousedown', () => c.style.transform = 'scale(.8)', true);
    addEventListener('mouseup', () => c.style.transform = '', true);
    const cap = document.createElement('div');
    cap.id = '__demo_caption';
    cap.style.cssText = 'position:fixed;z-index:2147483646;left:50%;bottom:22px;transform:translate(-50%,20px);opacity:0;transition:all .35s cubic-bezier(.2,.8,.2,1);background:rgba(15,47,34,.94);color:#fff;font:600 16px/1.3 "DM Sans",system-ui;padding:11px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis';
    document.body.appendChild(cap);
    window.__caption = (t) => {
      if (!t) { cap.style.opacity = 0; cap.style.transform = 'translate(-50%,20px)'; return; }
      cap.textContent = t; cap.style.opacity = 1; cap.style.transform = 'translate(-50%,0)';
    };
  };
  if (document.body) ready(); else addEventListener('DOMContentLoaded', ready);
})();
"""


def api(path, body=None):
    req = urllib.request.Request(BASE + "/api" + path, data=json.dumps(body).encode() if body else None,
                                 headers={"content-type": "application/json"})
    return json.load(urllib.request.urlopen(req))


async def caption(page, text):
    await page.evaluate("t => window.__caption && window.__caption(t)", text)


async def click(page, locator, pause=350):
    await locator.scroll_into_view_if_needed()
    box = await locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    await page.mouse.move(x, y, steps=18)
    await page.wait_for_timeout(120)
    await page.mouse.down()
    await page.mouse.up()
    await page.wait_for_timeout(pause)


async def type_slow(page, locator, text, delay=45):
    box = await locator.bounding_box()
    await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=18)
    await locator.focus()
    await locator.fill("")
    await locator.type(text, delay=delay)


async def smooth_scroll(page, to, duration=1400):
    await page.evaluate("""([to, d]) => new Promise(r => {
        const from = scrollY, t0 = performance.now();
        const step = t => { const k = Math.min(1, (t - t0) / d); const e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2) / 2;
          scrollTo(0, from + (to - from) * e); k < 1 ? requestAnimationFrame(step) : r(); };
        requestAnimationFrame(step); })""", [to, duration])


async def new_context(browser, video_dir, size):
    ctx = await browser.new_context(viewport=size, record_video_dir=str(video_dir), record_video_size=size, device_scale_factor=1)
    await ctx.add_init_script(OVERLAY_JS)
    return ctx


async def login(page, email, password):
    data = api("/auth/login", {"email": email, "password": password})
    await page.evaluate("d => { localStorage.setItem('fs.token', d.token); localStorage.setItem('fs.user', JSON.stringify(d.user)); }", data)


async def clip_customer(browser, tmp):
    ctx = await new_context(browser, tmp / "c1", {"width": 1280, "height": 800})
    page = await ctx.new_page()
    await page.goto(BASE + "/")
    await page.wait_for_timeout(500)
    await caption(page, "FoodSense — QR table ordering with AI review insights")
    await page.wait_for_timeout(3200)
    await caption(page, "212-dish menu dataset · live popularity from real orders")
    await smooth_scroll(page, 820)
    await page.wait_for_timeout(1300)
    await caption(page, "Sentiment model trained on 1,000 labelled restaurant reviews — try it live")
    lab_top = await page.evaluate("document.querySelector('.lab').getBoundingClientRect().top + scrollY - 140")
    await smooth_scroll(page, lab_top)
    lab = page.locator("#lab-text")
    await type_slow(page, lab, "Food came out cold and the service was slow", 38)
    await page.wait_for_timeout(1400)
    await type_slow(page, lab, "Crispy dosa, amazing chutney. Loved it!", 38)
    await page.wait_for_timeout(1600)

    await caption(page, "Scanning a table's QR code opens the menu with the table set")
    await page.goto(BASE + "/t/12")
    await page.wait_for_timeout(1800)
    await caption(page, "Search, veg / non-veg filters and sorting")
    await type_slow(page, page.get_by_placeholder("Search dosa, paneer, biryani…"), "dosa", 90)
    await page.wait_for_timeout(900)
    await click(page, page.get_by_role("radio", name="Veg", exact=True), 700)
    await click(page, page.get_by_role("button", name="Details for Mysore Masala Dosa"), 1200)
    await caption(page, "Each dish: ratings, model score and what diners actually said")
    await page.wait_for_timeout(1200)
    sheet = page.locator(".dialog-panel")
    await sheet.evaluate("el => el.scrollTo({ top: 520, behavior: 'smooth' })")
    await page.wait_for_timeout(1800)
    await sheet.evaluate("el => el.scrollTo({ top: 0, behavior: 'smooth' })")
    await page.wait_for_timeout(800)
    await click(page, sheet.get_by_role("button", name="Add one"), 400)
    await click(page, sheet.get_by_role("button", name="Add to order"), 1100)

    await caption(page, "Add to order — straight from the list")
    await click(page, page.get_by_role("button", name="Clear search"), 500)
    await click(page, page.get_by_role("radio", name="All", exact=True), 500)
    await type_slow(page, page.get_by_placeholder("Search dosa, paneer, biryani…"), "coffee", 80)
    await page.wait_for_timeout(500)
    await click(page, page.get_by_role("button", name="Add Filter Coffee to order"), 900)
    await type_slow(page, page.get_by_placeholder("Search dosa, paneer, biryani…"), "chicken 65", 70)
    await page.wait_for_timeout(500)
    await click(page, page.get_by_role("button", name="Add Chicken 65 to order"), 1000)

    await caption(page, "Your order — adjust quantities, GST included")
    await click(page, page.locator(".cart-btn"), 1500)
    await click(page, page.get_by_role("button", name="Go to checkout"), 1200)
    await caption(page, "Checkout — table, kitchen notes, payment (simulated)")
    await type_slow(page, page.locator("#co-name"), "Priya", 70)
    await type_slow(page, page.locator("#co-notes"), "Less spicy please", 50)
    await click(page, page.get_by_role("radio", name="UPI"), 600)
    await click(page, page.get_by_role("button", name="Place order"), 300)
    await caption(page, None)
    await page.wait_for_url("**/orders/**", timeout=10000)
    await page.wait_for_timeout(1200)
    await caption(page, "Live tracking with an ETA — now let's switch to the kitchen")
    await page.wait_for_timeout(2600)
    order_id = page.url.rsplit("/", 1)[-1]
    await ctx.close()
    return order_id


async def clip_live(browser, tmp, order_id):
    size = {"width": 640, "height": 800}
    cust_ctx = await new_context(browser, tmp / "c2a", size)
    kit_ctx = await new_context(browser, tmp / "c2b", size)
    cust, kit = await cust_ctx.new_page(), await kit_ctx.new_page()
    await kit.goto(BASE + "/")
    await login(kit, "kitchen@foodsense.ai", "kitchen123")
    await asyncio.gather(cust.goto(f"{BASE}/orders/{order_id}"), kit.goto(BASE + "/kitchen"))
    await cust.wait_for_timeout(900)
    await caption(cust, "Diner · table 12")
    await caption(kit, "Kitchen board · live tickets")
    await kit.wait_for_timeout(2000)
    ticket = kit.locator(".kot", has_text="Priya")
    for action in ["Start cooking", "Mark ready", "Mark served"]:
        await ticket.scroll_into_view_if_needed()
        await click(kit, ticket.get_by_role("button", name=action), 2300)
    await caption(kit, "Served — ticket leaves the board")
    await caption(cust, "Rate each dish — the model reads the review")
    await cust.wait_for_timeout(800)
    card = cust.locator(".rate-card").first
    await card.scroll_into_view_if_needed()
    await cust.wait_for_timeout(500)
    await click(cust, card.get_by_role("radio", name="5 stars"), 400)
    await type_slow(cust, card.locator("textarea"), "Perfectly crispy and the chutney was so fresh!", 35)
    await click(cust, card.get_by_role("button", name="Post review"), 2600)
    await cust_ctx.close()
    await kit_ctx.close()


async def clip_admin(browser, tmp):
    ctx = await new_context(browser, tmp / "c3", {"width": 1280, "height": 800})
    page = await ctx.new_page()
    await page.goto(BASE + "/")
    await login(page, "admin@foodsense.ai", "admin123")
    await page.goto(BASE + "/admin")
    await page.wait_for_timeout(800)
    await caption(page, "Admin dashboard — revenue, busy hours, top dishes")
    await page.wait_for_timeout(1500)
    bars = page.locator(".chart-bar")
    for i in [6, 10, 13]:
        b = await bars.nth(i).bounding_box()
        await page.mouse.move(b["x"] + b["width"] / 2, b["y"] + 10, steps=14)
        await page.wait_for_timeout(700)
    await caption(page, "Review sentiment and dishes that need attention")
    await smooth_scroll(page, 520)
    await page.wait_for_timeout(2600)
    await caption(page, "Menu control — mark a dish sold out, edit prices")
    await click(page, page.get_by_role("link", name="Menu").last, 1200)
    await click(page, page.get_by_role("switch", name="Gulab Jamun available"), 1600)
    await caption(page, "Printable QR codes for every table")
    await click(page, page.get_by_role("link", name="Table QR codes"), 2400)
    await caption(page, "FoodSense — github.com/nvaltryek-001/Food-Ordering")
    await page.wait_for_timeout(2600)
    await ctx.close()


def only_video(d):
    return next(Path(d).glob("*.webm"))


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp())
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME) if CHROME else await p.chromium.launch()
        order_id = await clip_customer(browser, tmp)
        await clip_live(browser, tmp, order_id)
        await clip_admin(browser, tmp)
        await browser.close()

    enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p", "-r", "30"]
    ff("-i", str(only_video(tmp / "c1")), *enc, str(tmp / "1.mp4"))
    ff("-i", str(only_video(tmp / "c2a")), "-i", str(only_video(tmp / "c2b")),
       "-filter_complex", "[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[a][b]hstack=inputs=2,trim=start=0.4[v]",
       "-map", "[v]", *enc, str(tmp / "2.mp4"))
    ff("-i", str(only_video(tmp / "c3")), *enc, str(tmp / "3.mp4"))
    (tmp / "list.txt").write_text("".join(f"file '{tmp / f'{i}.mp4'}'\n" for i in (1, 2, 3)))
    final = OUT / "foodsense-demo.mp4"
    ff("-f", "concat", "-safe", "0", "-i", str(tmp / "list.txt"), "-c", "copy", "-movflags", "+faststart", str(final))
    # README preview GIF: the first seconds of each section, small and light.
    gif = OUT / "foodsense-preview.gif"
    ff("-i", str(final), "-vf", "fps=8,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
       "-t", "16", str(gif))
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"✓ {final} ({final.stat().st_size / 1e6:.1f} MB)\n✓ {gif} ({gif.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
