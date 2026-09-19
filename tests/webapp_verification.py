import os
import sys
from playwright.sync_api import sync_playwright

def run_tests():
    print("Starting Playwright Webapp Test as Taufiq (assignee of cross-dept task)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Login as Taufiq
        print("1. Navigating to login page...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.wait_for_timeout(500)
        page.fill('input[type="email"], input[name="email"]', "taufiq@skolla.education")
        page.fill('input[type="password"], input[name="password"]', "SkollaEdu")
        page.click('button[type="submit"]')
        page.wait_for_function('() => window.location.pathname !== "/login"', timeout=10000)
        print("Logged in, current URL:", page.url)

        # 2. Check /team/my-work
        print("2. Checking /team/my-work...")
        page.goto("http://localhost:3000/team/my-work", wait_until="commit")
        page.wait_for_selector(".cross-dept-task-card", timeout=10000)

        my_work_cross_cards = page.locator(".cross-dept-task-card")
        print(f"Found {my_work_cross_cards.count()} cross-dept task cards in my-work")
        assert my_work_cross_cards.count() > 0, "Expected at least 1 cross-dept task card"
        
        mw_card = my_work_cross_cards.first
        # Verify no duplicate doc links on card
        mw_doc_links = mw_card.locator('a[target="_blank"]:has-text("Buka Dokumen")')
        print(f"External doc links on my-work card: {mw_doc_links.count()} (verified 0)")
        assert mw_doc_links.count() == 0, "my-work card still has external doc button!"

        # Open modal from my-work
        print("Opening CrossDeptCommentModal...")
        btn = mw_card.locator(".cross-dept-work-btn, .cross-dept-badge").first
        btn.click()
        page.wait_for_selector(".cross-dept-modal", timeout=5000)
        page.wait_for_selector("select.status-select-dropdown", timeout=5000)

        # Verify select dropdown in modal
        modal = page.locator(".cross-dept-modal")
        select_elem = modal.locator("select.status-select-dropdown")
        print(f"Modal status <select> found: {select_elem.count()}")
        assert select_elem.count() > 0, "Expected status <select> dropdown in modal"

        # Check options
        options = select_elem.locator("option").all_inner_texts()
        print("Modal status dropdown options:", options)
        for opt in ["TO DO", "IN PROGRESS", "NEED INFO", "RESOLVED", "CLOSED"]:
            assert any(opt in o for o in options), f"Missing {opt} in options"

        initial_val = select_elem.input_value()
        print("Initial dropdown status:", initial_val)

        # Check assignee restriction: Reopening CLOSED task shows error message
        print("Testing RBAC: Assignee attempting to reopen CLOSED task...")
        select_elem.select_option("IN_PROGRESS")
        page.wait_for_selector(".status-error-msg", timeout=5000)
        error_msg = modal.locator(".status-error-msg")
        assert error_msg.count() > 0 and error_msg.is_visible(), "Expected status error message on unauthorized reopen"
        print("Verified RBAC error displayed:", error_msg.inner_text())

        # Close modal
        close_btn = modal.locator(".modal-close-btn")
        close_btn.click()
        page.wait_for_timeout(500)

        # 3. Check /initiatives Kanban column mapping
        print("3. Checking /initiatives Kanban column mapping...")
        page.goto("http://localhost:3000/initiatives", wait_until="domcontentloaded")
        page.wait_for_selector('text="Bug TO"', timeout=10000)

        # CLOSED should map to DONE column
        done_col = page.locator('.kanban-column:has-text("DONE"), .column:has-text("DONE")').first
        done_cards = done_col.locator('text="Bug TO"')
        print(f"Task 'Bug TO' in DONE column count: {done_cards.count()}")
        assert done_cards.count() > 0, "Task 'Bug TO' should be under DONE column when CLOSED"

        print("=== ALL WEBAPP TESTS PASSED SUCCESSFULLY! ===")
        browser.close()

if __name__ == "__main__":
    os.makedirs("tests/screenshots", exist_ok=True)
    run_tests()



