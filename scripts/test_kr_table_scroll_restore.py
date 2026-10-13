from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def main():
    print("=== TEST: KR Table Scroll Position Restore ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        try:
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.fill("#email", "hrd@skolla.education")
            page.fill("#password", "SkollaEdu")
            page.click("button[type='submit']")
            page.wait_for_url(lambda u: "/login" not in u, timeout=15000)

            page.goto(f"{BASE_URL}/admin/objectives", wait_until="networkidle")
            page.wait_for_timeout(2000)

            table_container = page.locator(".kr-table-container")
            assert table_container.is_visible()
            rows = page.locator(".kr-table-row")
            assert rows.count() >= 15

            # 1. Test Edit on Row 15
            target_row = rows.nth(14)
            kr_id = target_row.get_attribute("data-kr-id")
            target_row.scroll_into_view_if_needed()
            page.wait_for_timeout(400)

            scroll_before = page.evaluate("() => document.querySelector('.kr-table-container').scrollTop")
            print(f"Row 15 scrollTop before edit: {scroll_before}px")
            assert scroll_before > 200

            target_row.locator("button.edit-kr-btn").click()
            page.wait_for_timeout(500)
            modal = page.locator(".modal-card", has_text="Edit Key Result")
            modal.locator("button.save-kr-btn").click()
            page.wait_for_timeout(1000)
            assert not modal.is_visible()

            scroll_after = page.evaluate("() => document.querySelector('.kr-table-container').scrollTop")
            print(f"Row 15 scrollTop after edit: {scroll_after}px")
            assert scroll_after > 200, f"Table reset to top! ({scroll_after})"

            is_visible = page.evaluate(f"""() => {{
                const c = document.querySelector('.kr-table-container');
                const r = document.querySelector('#kr-row-{kr_id}');
                if (!c || !r) return false;
                const cr = c.getBoundingClientRect();
                const rr = r.getBoundingClientRect();
                return rr.top >= cr.top - 15 && rr.bottom <= cr.bottom + 15;
            }}""")
            print(f"Row 15 still visible in container: {is_visible}")
            assert is_visible

            # 2. Test Re-assign on Row 20
            reassign_row = rows.nth(19)
            reassign_id = reassign_row.get_attribute("data-kr-id")
            reassign_row.scroll_into_view_if_needed()
            page.wait_for_timeout(400)

            scroll_reassign_before = page.evaluate("() => document.querySelector('.kr-table-container').scrollTop")
            print(f"Row 20 scrollTop before reassign: {scroll_reassign_before}px")
            assert scroll_reassign_before > 400

            reassign_row.locator("button.reassign-kr-btn").click()
            page.wait_for_timeout(500)
            r_modal = page.locator(".modal-card", has_text="Re-assign Departemen")
            r_modal.locator("button.save-kr-btn").click()
            page.wait_for_timeout(1000)
            assert not r_modal.is_visible()

            scroll_reassign_after = page.evaluate("() => document.querySelector('.kr-table-container').scrollTop")
            print(f"Row 20 scrollTop after reassign: {scroll_reassign_after}px")
            assert scroll_reassign_after > 400, f"Table reset to top! ({scroll_reassign_after})"

            r_visible = page.evaluate(f"""() => {{
                const c = document.querySelector('.kr-table-container');
                const r = document.querySelector('#kr-row-{reassign_id}');
                if (!c || !r) return false;
                const cr = c.getBoundingClientRect();
                const rr = r.getBoundingClientRect();
                return rr.top >= cr.top - 15 && rr.bottom <= cr.bottom + 15;
            }}""")
            print(f"Row 20 still visible in container: {r_visible}")
            assert r_visible

            print("=== TEST PASSED! ===")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
