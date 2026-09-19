import os
from playwright.sync_api import sync_playwright

def test_status_update():
    print("Testing status update via modal dropdown on /team/my-work...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Login
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        page.fill('input[type="email"]', "taufiq@skolla.education")
        page.fill('input[type="password"]', "SkollaEdu")
        page.click('button[type="submit"]')
        page.wait_for_url("**/dashboard", timeout=5000)

        # Go to /team/my-work
        print("Navigating to /team/my-work...")
        page.goto("http://localhost:3000/team/my-work", wait_until="networkidle")
        page.wait_for_timeout(1500)

        # Find Detail button on cross-dept card
        btn = page.locator('.cross-dept-work-btn, .cross-dept-badge').first
        print("Clicking modal trigger...")
        btn.click()
        page.wait_for_selector(".cross-dept-modal", timeout=5000)
        print("Modal opened successfully!")

        select_elem = page.locator("select.status-select-native")
        print("Initial dropdown status value:", select_elem.input_value())

        # Select IN_PROGRESS
        print("Selecting IN_PROGRESS...")
        select_elem.select_option("IN_PROGRESS")
        page.wait_for_timeout(1000)
        print("Dropdown status value after update:", select_elem.input_value())
        assert select_elem.input_value() == "IN_PROGRESS"

        # Revert back to CLOSED
        print("Reverting back to CLOSED...")
        select_elem.select_option("CLOSED")
        page.wait_for_timeout(1000)
        print("Dropdown status value after revert:", select_elem.input_value())
        assert select_elem.input_value() == "CLOSED"

        # Close modal
        page.locator(".cross-dept-modal .btn-close-modal").first.click()
        print("Closed modal successfully.")
        page.wait_for_timeout(500)

        browser.close()
        print("All dropdown actions verified successfully!")

if __name__ == "__main__":
    test_status_update()


