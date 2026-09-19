import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def test_expand_collapse():
    print("=== Testing Expand/Collapse in kr-group-card on Dashboard ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Capture console messages
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

            # Step 3: Find KR group cards and init progress rows
            kr_cards = page.locator(".kr-group-card")
            card_count = kr_cards.count()
            print(f"   -> Found {card_count} kr-group-card elements.")
            assert card_count > 0, "No kr-group-card found on dashboard"

            init_rows = page.locator(".kr-group-card .init-progress-row")
            row_count = init_rows.count()
            print(f"   -> Found {row_count} init-progress-row elements.")
            assert row_count > 0, "No init-progress-row found"

            # Find an initiative with tasks (has button.task-count-mini)
            target_row = None
            target_title = ""
            for i in range(row_count):
                row = init_rows.nth(i)
                btn = row.locator("button.task-count-mini")
                if btn.count() > 0:
                    target_row = row
                    target_title = row.locator(".init-row-title").inner_text()
                    break

            assert target_row is not None, "No initiative with tasks found"
            print(f"   -> Selected initiative with tasks: '{target_title}'")

            # Check initial state: COLLAPSED
            task_grid = target_row.locator(".task-detail-grid")
            assert task_grid.count() == 0, "Expected tasks to be collapsed initially"
            assert "is-expanded" not in (target_row.get_attribute("class") or "")
            print("   -> Initial state: COLLAPSED verified.")
            target_row.screenshot(path="/tmp/init-collapsed.png")

            # Step 4: Click button to expand
            print("3. Clicking toggle button to EXPAND...")
            btn = target_row.locator("button.task-count-mini")
            btn.click()
            page.wait_for_timeout(400)

            # Check expanded state
            assert "is-expanded" in (target_row.get_attribute("class") or ""), "Expected row to have is-expanded class"
            assert task_grid.count() == 1, "Expected task-detail-grid to be rendered"
            task_count = task_grid.locator(".task-detail-row").count()
            print(f"   -> Expanded state verified! Visible tasks: {task_count}")
            target_row.screenshot(path="/tmp/init-expanded.png")

            # Step 5: Click row header to COLLAPSE
            print("4. Clicking row header to COLLAPSE...")
            header = target_row.locator(".init-row-header")
            header.click()
            page.wait_for_timeout(400)

            # Check collapsed state again
            assert task_grid.count() == 0, "Expected task-detail-grid to be hidden after collapse"
            assert "is-expanded" not in (target_row.get_attribute("class") or "")
            print("   -> Collapsed state verified again!")

            # Step 6: Test role LEADER / MANAGER / C_LEVEL
            print("5. Testing Leader visibility...")
            # Section screenshot
            kr_section = page.locator("section:has(.kr-group-card)").first
            kr_section.screenshot(path="/tmp/init-section-dashboard.png")
            print("   -> Saved /tmp/init-section-dashboard.png")

            print("\n=== SUCCESS: ALL PLAYWRIGHT TESTS PASSED ===")
            return True

        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            page.screenshot(path="/tmp/error-init-test.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    success = test_expand_collapse()
    sys.exit(0 if success else 1)


