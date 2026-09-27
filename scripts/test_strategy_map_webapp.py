import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def test_strategy_map():
    print("=== STARTING STRATEGY MAP WEBAPP TESTING ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1000})
        page = context.new_page()

        try:
            # 1. Login
            print("[1] Logging in...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.fill("#email", "admin@skolla.education")
            page.fill("#password", "SkollaEdu")
            page.click("button[type='submit']")
            page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
            print("    Logged in successfully.")

            # 2. Navigate to Strategy Map
            print("[2] Navigating to Strategy Map...")
            page.goto(f"{BASE_URL}/strategy-map", wait_until="networkidle")
            page.wait_for_timeout(2000)

            # Check Page Header
            title_text = page.locator(".page-title").text_content()
            print(f"    Page Title: {title_text}")
            assert "Perubahan KR & KPI Skolla 2026" in title_text, f"Unexpected title: {title_text}"

            # Check 4 Swimlanes
            lanes = page.locator(".lane-title").all_text_contents()
            print(f"    Swimlanes found: {lanes}")
            expected_lanes = ["FINANCIAL", "CUSTOMER", "INTERNAL PROCESS", "LEARNING & GROWTH"]
            for el in expected_lanes:
                assert el in lanes, f"Missing swimlane: {el}"

            # Check 13 Nodes
            node_cards = page.locator(".strategic-card").all()
            print(f"    Total objective cards rendered: {len(node_cards)}")
            assert len(node_cards) == 13, f"Expected 13 cards, got {len(node_cards)}"

            # Check SVG edges
            edges = page.locator(".edge-path").all()
            print(f"    Total SVG connection paths rendered: {len(edges)}")
            assert len(edges) == 16, f"Expected 16 edges, got {len(edges)}"

            # Take screenshot of default view
            page.screenshot(path="/tmp/strategy_map_default.png", full_page=True)
            print("    Screenshot saved: /tmp/strategy_map_default.png")

            # 3. Test Node Selection / Focus
            print("[3] Testing Node Focus on F1...")
            page.locator("#node-F1").click()
            page.wait_for_timeout(800)

            # Check active state
            assert "active" in (page.locator("#node-F1").get_attribute("class") or "")
            assert page.locator(".focus-alert-bar").is_visible()
            assert page.locator(".inspector-detail").is_visible()
            detail_heading = page.locator(".detail-heading").text_content()
            print(f"    Detail Inspector Heading: {detail_heading}")
            assert "Meningkatkan Pendapatan" in detail_heading

            page.screenshot(path="/tmp/strategy_map_focused.png", full_page=True)
            print("    Screenshot saved: /tmp/strategy_map_focused.png")

            # 4. Clear focus via Esc
            print("[4] Clearing focus via Escape key...")
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            assert page.locator(".inspector-list").is_visible()
            print("    Inspector returned to list view.")

            # 5. Test Pengecekan Mode
            print("[5] Switching to Mode Pengecekan...")
            page.locator(".mode-btn:has-text('Pengecekan')").click()
            page.wait_for_timeout(500)
            assert page.locator(".validation-panel").is_visible()
            val_cards = page.locator(".val-card").all()
            print(f"    Validation cards visible: {len(val_cards)}")
            assert len(val_cards) == 4

            page.screenshot(path="/tmp/strategy_map_checkmode.png", full_page=True)
            print("    Screenshot saved: /tmp/strategy_map_checkmode.png")

            # 6. Test Admin Modal
            print("[6] Testing Admin Link Management Modal...")
            page.locator(".admin-action-btn").click()
            page.wait_for_timeout(500)
            assert page.locator(".modal-card").is_visible()
            modal_title = page.locator(".modal-header h3").text_content()
            print(f"    Modal opened: {modal_title}")
            page.locator(".modal-header .close-btn").click()
            page.wait_for_timeout(300)
            assert not page.locator(".modal-card").is_visible()
            print("    Modal closed successfully.")

            print("\nALL STRATEGY MAP WEBAPP TESTS PASSED!")

        except Exception as e:
            print(f"\nTEST FAILED WITH ERROR: {e}")
            page.screenshot(path="/tmp/strategy_map_error.png")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    test_strategy_map()
