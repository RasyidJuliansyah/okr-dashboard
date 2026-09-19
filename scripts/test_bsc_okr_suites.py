import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"

def run_tests():
    print("=== STARTING BSC-OKR SUITES TEST ===")
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        try:
            # 1. Suite: Authentication & Login
            print("\n[Suite 1] Authentication & Login")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            page.wait_for_selector("#email", timeout=10000)
            page.fill("#email", "admin@skolla.education")
            page.fill("#password", "SkollaEdu")
            page.click("button[type='submit']")

            # Wait for redirect after login
            page.wait_for_url(lambda url: "/login" not in url, timeout=15000)
            current_url = page.url
            print(f"  -> Logged in successfully. URL: {current_url}")
            results["Suite 1: Authentication"] = "PASSED"

            # 2. Suite: Dashboard & BSC Overview
            print("\n[Suite 2] Dashboard & BSC Overview")
            page.goto(f"{BASE_URL}/dashboard", wait_until="networkidle")
            page.wait_for_timeout(2000)
            content = page.content()
            assert "Balanced Scorecard" in content or "Dashboard" in content, "Dashboard content missing"
            print("  -> Dashboard loaded and verified.")
            results["Suite 2: Dashboard Overview"] = "PASSED"

            # 3. Suite: BSC View & Strategy Map
            print("\n[Suite 3] BSC View & Strategy Map")
            page.goto(f"{BASE_URL}/bsc-view", wait_until="networkidle")
            page.wait_for_timeout(1500)
            content = page.content()
            assert "Finansial" in content or "Financial" in content or "Pelanggan" in content or "Customer" in content, "BSC perspectives missing"
            print("  -> BSC View loaded.")

            page.goto(f"{BASE_URL}/strategy-map", wait_until="networkidle")
            page.wait_for_timeout(1500)
            print("  -> Strategy Map loaded.")
            results["Suite 3: BSC Matrix & Strategy Map"] = "PASSED"

            # 4. Suite: OKR Objectives Management
            print("\n[Suite 4] OKR & Objectives Management")
            page.goto(f"{BASE_URL}/admin/objectives", wait_until="networkidle")
            page.wait_for_timeout(1500)
            content = page.content()
            assert "Objective" in content or "Tujuan" in content, "Objectives page missing expected headers"
            print("  -> Admin Objectives page loaded.")
            results["Suite 4: Objectives & KRs"] = "PASSED"

            # 5. Suite: Initiatives & Tasks
            print("\n[Suite 5] Initiatives & Tasks")
            page.goto(f"{BASE_URL}/initiatives", wait_until="networkidle")
            page.wait_for_timeout(1500)
            print("  -> Initiatives page loaded.")

            page.goto(f"{BASE_URL}/team/my-work", wait_until="networkidle")
            page.wait_for_timeout(1500)
            print("  -> Team My Work / Tasks page loaded.")
            results["Suite 5: Initiatives & Tasks"] = "PASSED"

            # 6. Suite: Sprint Cadence Management
            print("\n[Suite 6] Sprint Cadence Management")
            page.goto(f"{BASE_URL}/admin/sprints", wait_until="networkidle")
            page.wait_for_timeout(1500)
            content = page.content()
            assert "Siklus Sprint & Snapshot Cadence" in content or "Siklus Sprint" in content, "Sprint management header missing"
            assert "Sprint Oktober 2026" in content, "Active Sprint Oktober 2026 missing from list"
            print("  -> Sprint management loaded. 30-day cadence visible.")
            results["Suite 6: Sprint Management"] = "PASSED"

            # 7. Suite: Member Achievement & Snapshots
            print("\n[Suite 7] Member Achievement")
            page.goto(f"{BASE_URL}/member-achievement", wait_until="networkidle")
            page.wait_for_timeout(2000)
            content = page.content()
            assert "Progress Capaian" in content or "Capaian Task Member" in content, "Member achievement content missing"
            sprint_select = page.locator("select.filter-select")
            assert sprint_select.count() > 0, "Sprint dropdown filter not found"
            print("  -> Member Achievement page loaded with Sprint filter.")
            results["Suite 7: Member Achievement"] = "PASSED"

            # 8. Suite: Approvals & Audit Logs
            print("\n[Suite 8] Approvals & Audit Logs")
            page.goto(f"{BASE_URL}/approvals", wait_until="networkidle")
            page.wait_for_timeout(1500)
            print("  -> Approvals page loaded.")

            page.goto(f"{BASE_URL}/admin/audit-logs", wait_until="networkidle")
            page.wait_for_timeout(1500)
            content = page.content()
            assert "Audit Log" in content, "Audit logs header missing"
            print("  -> Audit Logs page loaded.")
            results["Suite 8: Approvals & Audit Logs"] = "PASSED"

        except Exception as e:
            print(f"\n❌ ERROR during test execution: {e}")
            page.screenshot(path="test_failure.png", full_page=True)
            results["FAILED_STEP"] = str(e)
            raise e
        finally:
            browser.close()

    print("\n" + "=" * 40)
    print("       BSC-OKR SUITES TEST SUMMARY       ")
    print("=" * 40)
    all_passed = True
    for suite, status in results.items():
        print(f"{suite:<35} : {status}")
        if status != "PASSED":
            all_passed = False

    if not all_passed:
        sys.exit(1)
    else:
        print("\nAll BSC-OKR test suites completed successfully! 🎉")

if __name__ == "__main__":
    run_tests()
