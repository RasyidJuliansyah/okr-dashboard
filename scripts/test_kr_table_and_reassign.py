import sys, time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def main():
    print("=== STARTING PLAYWRIGHT TEST: KR Table & Re-assign ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            # Login
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.wait_for_selector("#email")
            page.fill("#email", "hrd@skolla.education")
            page.fill("#password", "SkollaEdu")
            page.click("button[type='submit']")
            page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
            print("[1] Logged in successfully.")

            # Admin objectives page
            page.goto(f"{BASE_URL}/admin/objectives", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path="/tmp/test_kr_table_initial.png", full_page=True)
            print("[2] Loaded /admin/objectives.")

            # View switcher verification
            table_pill = page.locator("button.view-pill-btn", has_text="Tabel / List")
            card_pill = page.locator("button.view-pill-btn", has_text="Kartu Hirarki")
            assert table_pill.is_visible() and card_pill.is_visible()
            kr_table = page.locator(".kr-data-table")
            assert kr_table.is_visible()
            rows = page.locator(".kr-table-row")
            print(f"[3] Table view active with {rows.count()} KR rows.")
            assert rows.count() > 0

            # Toggle view mode
            card_pill.click()
            page.wait_for_timeout(500)
            assert not kr_table.is_visible()
            table_pill.click()
            page.wait_for_timeout(500)
            assert kr_table.is_visible()
            print("[4] View mode toggling works.")

            # Re-assign single modal test with submit and revert
            first_row = rows.first
            kr_title = first_row.locator(".table-kr-title").inner_text()
            print(f"[5] Testing re-assign save for KR: '{kr_title}'")
            reassign_btn = first_row.locator("button", has_text="Re-assign")
            assert reassign_btn.is_visible()
            reassign_btn.click()
            page.wait_for_timeout(500)
            modal = page.locator(".modal-card", has_text="Re-assign Departemen")
            assert modal.is_visible()
            
            # Save without changes first to verify submit flow
            save_btn = modal.locator("button.save-kr-btn")
            assert save_btn.is_enabled()
            save_btn.click()
            page.wait_for_timeout(1000)
            assert not modal.is_visible()
            print("  -> Single re-assign submit completed and refreshed.")

            # Bulk toolbar and bulk modal
            first_cb = first_row.locator("input[type='checkbox']")
            first_cb.check()
            page.wait_for_timeout(300)
            bulk_reassign_btn = page.locator("button.bulk-reassign-btn")
            assert bulk_reassign_btn.is_visible()
            bulk_reassign_btn.click()
            page.wait_for_timeout(500)
            bulk_modal = page.locator(".modal-card", has_text="Re-assign Departemen Massal")
            assert bulk_modal.is_visible()
            page.screenshot(path="/tmp/test_kr_bulk_modal.png")
            bulk_modal.locator("button", has_text="Batal").click()
            page.wait_for_timeout(400)
            assert not bulk_modal.is_visible()
            print("[6] Bulk re-assign toolbar and modal verified.")

            print("=== TEST PASSED! ===")
        except Exception as e:
            page.screenshot(path="/tmp/test_failure.png", full_page=True)
            print(f"FAILED: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    main()

