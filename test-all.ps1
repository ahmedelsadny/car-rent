
# ============================================================
# CarRent API - Comprehensive Test Script (PowerShell)
# ============================================================
$BASE = "http://localhost:3000/api/v1"
$passed = 0
$failed = 0
$errors = @()

function Write-Section($title) {
    Write-Host "`n$("=" * 60)" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "$("=" * 60)" -ForegroundColor Cyan
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Body = $null,
        [string]$Token = $null,
        [int]$ExpectStatus,
        [string]$ExpectContains = $null
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    try {
        $params = @{
            Method  = $Method
            Uri     = $Url
            Headers = $headers
            ErrorAction = "Stop"
        }
        if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }

        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $content = $response.Content
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        try { $content = $_.ErrorDetails.Message } catch { $content = $_.Exception.Message }
    }

    $ok = $statusCode -eq $ExpectStatus
    if ($ExpectContains -and $ok) {
        $ok = $content -like "*$ExpectContains*"
    }

    if ($ok) {
        Write-Host "  [PASS] $Name  (HTTP $statusCode)" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name  (Expected $ExpectStatus, Got $statusCode)" -ForegroundColor Red
        Write-Host "         Response: $($content.Substring(0, [Math]::Min(200, $content.Length)))" -ForegroundColor DarkRed
        $script:failed++
        $script:errors += "FAIL: $Name"
    }
    return $content
}

# ==============================================================
Write-Section "STEP 0 — Health check"
# ==============================================================
Test-Endpoint -Name "Server is up (GET /)" -Method GET -Url "$BASE/../.." -ExpectStatus 404

# ==============================================================
Write-Section "STEP 1 — Auth: Login as test customer"
# ==============================================================
# Request OTP
$otpBody = @{ phone = "+201222222222" }
Test-Endpoint -Name "Request OTP" -Method POST -Url "$BASE/auth/request-otp" -Body $otpBody -ExpectStatus 201

# Verify OTP → get token
$verifyBody = @{ phone = "+201222222222"; code = "111111" }
$loginResp = Test-Endpoint -Name "Verify OTP → get JWT" -Method POST -Url "$BASE/auth/verify-otp" -Body $verifyBody -ExpectStatus 201
$customerToken = ($loginResp | ConvertFrom-Json).token
Write-Host "  Customer Token: $($customerToken.Substring(0,30))..." -ForegroundColor DarkGray

# ==============================================================
Write-Section "STEP 2 — User Profile"
# ==============================================================
Test-Endpoint -Name "GET /users/me" -Method GET -Url "$BASE/users/me" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "PATCH /users/me (update name)" -Method PATCH -Url "$BASE/users/me" -Token $customerToken -Body @{ name = "Ahmed Test" } -ExpectStatus 200
Test-Endpoint -Name "GET /users/me/stats" -Method GET -Url "$BASE/users/me/stats" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "GET /users/me (no token → 401)" -Method GET -Url "$BASE/users/me" -ExpectStatus 401

# ==============================================================
Write-Section "STEP 3 — Owner Registration"
# ==============================================================
$ownerBody = @{
    businessName = "معرض اختبار التيست"
    address      = "القاهرة، مصر"
    logoUrl      = "https://example.com/logo.png"
    coverUrl     = "https://example.com/cover.png"
    description  = "معرض تجريبي لاختبار الـ API"
}
$ownerResp = Test-Endpoint -Name "POST /owners/register" -Method POST -Url "$BASE/owners/register" -Token $customerToken -Body $ownerBody -ExpectStatus 201
$ownerId = try { ($ownerResp | ConvertFrom-Json).id } catch { "" }

Test-Endpoint -Name "POST /owners/register (duplicate → 409)" -Method POST -Url "$BASE/owners/register" -Token $customerToken -Body $ownerBody -ExpectStatus 409
Test-Endpoint -Name "GET /owners/me" -Method GET -Url "$BASE/owners/me" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "PATCH /owners/me" -Method PATCH -Url "$BASE/owners/me" -Token $customerToken -Body @{ description = "تم التعديل" } -ExpectStatus 200
Test-Endpoint -Name "GET /owners/me/dashboard" -Method GET -Url "$BASE/owners/me/dashboard" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "GET /owners/me/bookings" -Method GET -Url "$BASE/owners/me/bookings" -Token $customerToken -ExpectStatus 200

# ==============================================================
Write-Section "STEP 4 — Cars: Add + Validate"
# ==============================================================
$carBody = @{
    make           = "Toyota"
    model          = "Camry"
    year           = 2023
    licensePlate   = "TEST-001"
    color          = "White"
    pricePerDay    = 500
    depositAmount  = 2000
    seats          = 5
    transmission   = "automatic"
    imageUrls      = @("https://example.com/car1.jpg")
    availableFrom  = "2026-01-01"
    availableTo    = "2026-12-31"
}
$carResp = Test-Endpoint -Name "POST /cars (create car)" -Method POST -Url "$BASE/cars" -Token $customerToken -Body $carBody -ExpectStatus 201
$carId = try { ($carResp | ConvertFrom-Json).id } catch { "" }
Write-Host "  Car ID: $carId" -ForegroundColor DarkGray

Test-Endpoint -Name "POST /cars (duplicate plate → 409)" -Method POST -Url "$BASE/cars" -Token $customerToken -Body $carBody -ExpectStatus 409
Test-Endpoint -Name "GET /cars/owner/my-cars" -Method GET -Url "$BASE/cars/owner/my-cars" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "GET /cars (public list)" -Method GET -Url "$BASE/cars" -ExpectStatus 200

# Car not approved yet → not in public list
Test-Endpoint -Name "GET /cars/:id (not approved → 404)" -Method GET -Url "$BASE/cars/$carId" -ExpectStatus 404

Test-Endpoint -Name "PATCH /cars/:id (update car)" -Method PATCH -Url "$BASE/cars/$carId" -Token $customerToken -Body @{ color = "Black"; pricePerDay = 600 } -ExpectStatus 200

# ==============================================================
Write-Section "STEP 5 — Admin: Approve Car"
# ==============================================================
# Login as Admin — need a separate admin account. Use same test account + isAdmin flag
# We'll use the customer token and expect 403 for non-admin calls
Test-Endpoint -Name "GET /cars/admin/pending (non-admin → 403)" -Method GET -Url "$BASE/cars/admin/pending" -Token $customerToken -ExpectStatus 403
Test-Endpoint -Name "GET /owners/admin/pending (non-admin → 403)" -Method GET -Url "$BASE/owners/admin/pending" -Token $customerToken -ExpectStatus 403
Test-Endpoint -Name "GET /users/admin/dashboard-stats (non-admin → 403)" -Method GET -Url "$BASE/users/admin/dashboard-stats" -Token $customerToken -ExpectStatus 403

# Approve the car directly via DB is not possible here, skip booking tests that need approved car
# We'll note: further booking tests will fail if car not approved

# ==============================================================
Write-Section "STEP 6 — Availability Blocks (Owner)"
# ==============================================================
if ($carId) {
    # Add block — valid dates
    $blockBody = @{
        carId     = $carId
        startDate = "2026-07-10"
        endDate   = "2026-07-15"
        reason    = "صيانة دورية"
    }
    $blockResp = Test-Endpoint -Name "POST /cars/availability-blocks (add block)" -Method POST -Url "$BASE/cars/availability-blocks" -Token $customerToken -Body $blockBody -ExpectStatus 201
    $blockId = try { ($blockResp | ConvertFrom-Json).id } catch { "" }
    Write-Host "  Block ID: $blockId" -ForegroundColor DarkGray

    # Add block — invalid dates (end <= start)
    Test-Endpoint -Name "POST /cars/availability-blocks (end<=start → 400)" -Method POST -Url "$BASE/cars/availability-blocks" -Token $customerToken -Body @{
        carId = $carId; startDate = "2026-07-15"; endDate = "2026-07-10"; reason = "bad"
    } -ExpectStatus 400

    # Add block — no token
    Test-Endpoint -Name "POST /cars/availability-blocks (no auth → 401)" -Method POST -Url "$BASE/cars/availability-blocks" -Body $blockBody -ExpectStatus 401

    # GET blocks
    Test-Endpoint -Name "GET /cars/:id/availability-blocks" -Method GET -Url "$BASE/cars/$carId/availability-blocks" -Token $customerToken -ExpectStatus 200

    # DELETE block
    if ($blockId) {
        Test-Endpoint -Name "DELETE /cars/availability-blocks/:blockId" -Method DELETE -Url "$BASE/cars/availability-blocks/$blockId" -Token $customerToken -ExpectStatus 200
        Test-Endpoint -Name "DELETE /cars/availability-blocks/:blockId (again → 404)" -Method DELETE -Url "$BASE/cars/availability-blocks/$blockId" -Token $customerToken -ExpectStatus 404
    }

    # Re-add block for later conflict test
    $blockResp2 = Test-Endpoint -Name "POST /cars/availability-blocks (re-add for tests)" -Method POST -Url "$BASE/cars/availability-blocks" -Token $customerToken -Body $blockBody -ExpectStatus 201
    $blockId2 = try { ($blockResp2 | ConvertFrom-Json).id } catch { "" }
} else {
    Write-Host "  [SKIP] No car ID — skipping block tests" -ForegroundColor Yellow
}

# ==============================================================
Write-Section "STEP 7 — Showroom Snooze"
# ==============================================================
# Activate snooze
Test-Endpoint -Name "PATCH /cars/owner/snooze (activate until 2027)" -Method PATCH -Url "$BASE/cars/owner/snooze" -Token $customerToken -Body @{ until = "2027-01-01" } -ExpectStatus 200 -ExpectContains "snooze"

# Check cars list — snoozing owner's cars should not appear
Test-Endpoint -Name "GET /cars (snoozed owner hidden)" -Method GET -Url "$BASE/cars" -ExpectStatus 200

# Deactivate snooze
Test-Endpoint -Name "PATCH /cars/owner/snooze (deactivate)" -Method PATCH -Url "$BASE/cars/owner/snooze" -Token $customerToken -Body @{ until = $null } -ExpectStatus 200

# No token → 401
Test-Endpoint -Name "PATCH /cars/owner/snooze (no token → 401)" -Method PATCH -Url "$BASE/cars/owner/snooze" -Body @{ until = "2027-01-01" } -ExpectStatus 401

# ==============================================================
Write-Section "STEP 8 — Bookings (need approved car)"
# ==============================================================
Write-Host "  NOTE: Booking tests require an admin-approved car." -ForegroundColor Yellow
Write-Host "  The car created above (TEST-001) is NOT approved yet." -ForegroundColor Yellow
Write-Host "  Testing rejection scenarios (unapproved car → 404)..." -ForegroundColor Yellow

if ($carId) {
    $bookingBody = @{
        carId               = $carId
        startDate           = "2026-08-01"
        endDate             = "2026-08-05"
        deliveryType        = "PICKUP"
        nationalIdFrontUrl  = "https://example.com/id-front.jpg"
        nationalIdBackUrl   = "https://example.com/id-back.jpg"
        insuranceType       = "BASIC"
    }
    Test-Endpoint -Name "POST /bookings (unapproved car → 404)" -Method POST -Url "$BASE/bookings" -Token $customerToken -Body $bookingBody -ExpectStatus 404

    # Booking with past start date
    $pastBookingBody = $bookingBody.Clone()
    $pastBookingBody["startDate"] = "2020-01-01"
    $pastBookingBody["endDate"] = "2020-01-05"
    Test-Endpoint -Name "POST /bookings (past start date → 400)" -Method POST -Url "$BASE/bookings" -Token $customerToken -Body $pastBookingBody -ExpectStatus 400

    # Booking with end < start
    $badDatesBody = $bookingBody.Clone()
    $badDatesBody["startDate"] = "2026-08-10"
    $badDatesBody["endDate"] = "2026-08-05"
    Test-Endpoint -Name "POST /bookings (end < start → 400)" -Method POST -Url "$BASE/bookings" -Token $customerToken -Body $badDatesBody -ExpectStatus 400

    # Booking without nationalIdFrontUrl → validation error
    $missingIdBody = @{
        carId        = $carId
        startDate    = "2026-08-01"
        endDate      = "2026-08-05"
        deliveryType = "PICKUP"
    }
    Test-Endpoint -Name "POST /bookings (missing ID images → 400)" -Method POST -Url "$BASE/bookings" -Token $customerToken -Body $missingIdBody -ExpectStatus 400
}

# GET /bookings/me — own bookings
Test-Endpoint -Name "GET /bookings/me" -Method GET -Url "$BASE/bookings/me" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "GET /bookings/me (no token → 401)" -Method GET -Url "$BASE/bookings/me" -ExpectStatus 401

# ==============================================================
Write-Section "STEP 9 — System Settings (Admin only)"
# ==============================================================
Test-Endpoint -Name "GET /users/admin/settings (non-admin → 403)" -Method GET -Url "$BASE/users/admin/settings" -Token $customerToken -ExpectStatus 403
Test-Endpoint -Name "PATCH /users/admin/settings/:key (non-admin → 403)" -Method PATCH -Url "$BASE/users/admin/settings/driver_fee_per_day" -Token $customerToken -Body @{ value = "200" } -ExpectStatus 403

# ==============================================================
Write-Section "STEP 10 — Cars: Delete (with active booking protection)"
# ==============================================================
if ($carId) {
    Test-Endpoint -Name "DELETE /cars/:id (no active booking → 200)" -Method DELETE -Url "$BASE/cars/$carId" -Token $customerToken -ExpectStatus 200
    Test-Endpoint -Name "DELETE /cars/:id (already deleted → 404)" -Method DELETE -Url "$BASE/cars/$carId" -Token $customerToken -ExpectStatus 404
}

# ==============================================================
Write-Section "STEP 11 — Notifications"
# ==============================================================
Test-Endpoint -Name "GET /notifications/me" -Method GET -Url "$BASE/notifications/me" -Token $customerToken -ExpectStatus 200
Test-Endpoint -Name "GET /notifications/me (no token → 401)" -Method GET -Url "$BASE/notifications/me" -ExpectStatus 401

# ==============================================================
Write-Section "STEP 12 — Reviews & Coupons"
# ==============================================================
Test-Endpoint -Name "GET /reviews (public)" -Method GET -Url "$BASE/reviews" -ExpectStatus 200
Test-Endpoint -Name "POST /coupons/validate (invalid code → 4xx)" -Method POST -Url "$BASE/coupons/validate" -Token $customerToken -Body @{ code = "BADCODE"; subtotal = 1000 } -ExpectStatus 400

# ==============================================================
Write-Section "FINAL RESULTS"
# ==============================================================
Write-Host ""
Write-Host "  PASSED: $passed" -ForegroundColor Green
Write-Host "  FAILED: $failed" -ForegroundColor Red
Write-Host "  TOTAL:  $($passed + $failed)" -ForegroundColor White

if ($errors.Count -gt 0) {
    Write-Host "`n  Failed Tests:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host "   - $e" -ForegroundColor Red }
}

Write-Host ""
if ($failed -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
} else {
    Write-Host "  Some tests failed. Review above." -ForegroundColor Yellow
}
