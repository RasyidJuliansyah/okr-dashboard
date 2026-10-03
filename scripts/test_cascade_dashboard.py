import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def test_cascade_dashboard():
    print("=== Testing Cascade Data on Dashboard (task-value & Initiative Progress) ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: print(f"Browser console [{msg.type}]: {msg.text}") if msg.type in ["error", "warning"] else None)

        try:
            # Step 1: Login
            print("1. Logging in as admin...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.wait_for_selector("#email", timeout=10000)
            page.fill("#email", "admin@skolla.education")
            page.fill("#password", "SkollaEdu")
            page.click("button[type='submit']")
            page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
            print(f"   -> Logged in successfully. Current URL: {page.url}")

            # Step 2: Navigate to Dashboard
            print("2. Navigating to Dashboard...")
            page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
            page.wait_for_timeout(2000)

            # Step 3: Check task-value and summary metrics
            print("3. Checking task-value and Key Result counts...")
            task_val = page.locator(".task-value").first.inner_text()
            ontrack = page.locator(".count-val.ontrack").first.inner_text()
            atrisk = page.locator(".count-val.atrisk").first.inner_text()
            offtrack = page.locator(".count-val.offtrack").first.inner_text()
            print(f"   -> Average Progress (.task-value): {task_val}")
            print(f"   -> Status Counts: On Track={ontrack}, At Risk={atrisk}, Off Track={offtrack}")
            assert task_val != "", "Average progress should not be empty"

            # Step 4: Check Cascade Test Key Results
            print("4. Checking Cascade Test KR cards and child Initiatives...")
            kr_cards = page.locator(".kr-group-card")
            card_count = kr_cards.count()
            print(f"   -> Total kr-group-cards: {card_count}")

            cascade_cards = []
            for i in range(card_count):
                card = kr_cards.nth(i)
                title = card.locator(".kr-group-title-wrap h4").inner_text()
                if "[Cascade Test]" in title:
                    cascade_cards.append(card)

            print(f"   -> Found {len(cascade_cards)} Cascade Test KR cards.")
            assert len(cascade_cards) >= 3, f"Expected 3 Cascade Test KR cards, got {len(cascade_cards)}"

            for idx, card in enumerate(cascade_cards):
                kr_title = card.locator(".kr-group-title-wrap h4").inner_text()
                kr_pct = card.locator(".kr-progress-pct").inner_text()
                print(f"\n   [KR {idx+1}]: {kr_title} -> {kr_pct}")

                init_rows = card.locator(".init-progress-row")
                for r_idx in range(init_rows.count()):
                    row = init_rows.nth(r_idx)
                    init_title = row.locator(".init-row-title").inner_text()
                    init_pct = row.locator(".init-pct").inner_text()
                    btn = row.locator("button.task-count-mini")
                    btn_text = btn.inner_text() if btn.count() > 0 else "0 Task"
                    print(f"      * Inisiatif: {init_title} | Capaian: {init_pct} ({btn_text})")

                    # Expand to see tasks
                    if btn.count() > 0:
                        btn.click()
                        page.wait_for_timeout(300)
                        task_items = row.locator(".task-detail-row")
                        for t_idx in range(task_items.count()):
                            t = task_items.nth(t_idx)
                            t_name = t.locator(".task-detail-name").inner_text()
                            t_val = t.locator(".task-detail-val").inner_text()
                            t_pct = t.locator(".task-mini-pct").inner_text()
                            print(f"         - Task: {t_name} [{t_val}] -> {t_pct}")

            # Step 5: Capture Screenshot
            page.locator("section:has(.kr-group-card)").first.screenshot(path="/tmp/cascade-dashboard-initiatives.png")
            print("\n5. Saved screenshot to /tmp/cascade-dashboard-initiatives.png")
            print("\n=== SUCCESS: ALL CASCADE VERIFICATIONS PASSED ===")
            return True

        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            page.screenshot(path="/tmp/error-cascade-test.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    success = test_cascade_dashboard()
    sys.exit(0 if success else 1)

