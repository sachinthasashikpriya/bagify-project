# Bagify Project — Comprehensive Code Review

> **Date:** 2026-06-27  
> **Scope:** Full-stack review — React/TypeScript frontend + Spring Boot microservices backend  
> **Author:** Code Review (AI-assisted)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [🔴 High Priority Issues](#3-high-priority-issues)
4. [🟡 Medium Priority Issues](#4-medium-priority-issues)
5. [🟢 Low Priority Issues](#5-low-priority-issues)
6. [✅ Industry Best Practices Followed](#6-industry-best-practices-followed)
7. [❌ Industry Best Practices Missed](#7-industry-best-practices-missed)
8. [Area-by-Area Breakdown](#8-area-by-area-breakdown)
9. [Summary Table](#9-summary-table)

---

## 1. Executive Summary

Bagify is a multi-vendor e-commerce platform built with a **React + TypeScript** frontend and a **Spring Boot microservices** backend (User, Product, Order, Notification services) behind a Spring Cloud Gateway + Eureka discovery layer. The project demonstrates solid architectural thinking for an individual academic project, but has several critical security and code-quality issues that must be addressed before any production deployment.

---

## 2. Architecture Overview

```
Browser (React/Vite)
      │
      ▼
API Gateway :8080 (Spring Cloud Gateway)
      │
      ├── /api/v1/auth/**   → User Service   :8085
      ├── /api/v1/users/**  → User Service   :8085
      ├── /api/v1/products/** → Product Service :8082
      ├── /api/v1/orders/**  → Order Service   :8083
      └── (notification unreachable from internet ✅)
```

The gateway pattern is correct and the Eureka service-discovery wiring is clean.

---

## 3. 🔴 High Priority Issues

These are issues that would cause a security breach, data corruption, or major functional failure. Fix these first.

---

### 3.1 — Secrets Committed in Plain Text to the Repository

**Files:**
- `bagify-backend/user/src/main/resources/application.properties`
- `bagify-backend/order/src/main/resources/application.yml`

**What was found:**
```properties
# application.properties (user service)
spring.mail.username=sachinthasashikpriya8968@gmail.com
spring.mail.password=enarssuqivyqjpnn          # ← REAL Gmail App Password in repo

# application.yml (order service)
password: sachintha2002                        # ← Real DB password in repo
jwt.secret: bagify-super-secret-key-change-me-in-production-min-32-chars!!
payhere.merchant-secret: MzI2OTAwOTA4...       # ← Real PayHere secret in repo

# application.yml (user service)
password: sachintha2002                        # ← Real DB password in repo
```

**Risk:** Anyone with access to the Git repository can steal these credentials, send emails from your account, access the database, and forge JWT tokens.

**Fix:**
```properties
# application.properties — use environment variables
spring.mail.password=${MAIL_PASSWORD}
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```
Then supply real values via OS environment variables or a `.env` file that is listed in `.gitignore`. You should also rotate every leaked credential immediately.

---

### 3.2 — Internal Stats/Rating Endpoints Have No Authentication

**File:** `bagify-backend/user/src/main/java/com/mycompany/app/user/controller/UserController.java` (lines 149–175)

```java
@PutMapping("/buyers/{id}/stats")
public ResponseEntity<Void> updateBuyerStats(         // ← NO @PreAuthorize
        @PathVariable Integer id,
        @RequestParam double spentDelta) { ... }

@PutMapping("/sellers/{id}/stats")
public ResponseEntity<Void> updateSellerStats(...) { ... }  // ← NO @PreAuthorize

@PutMapping("/sellers/{id}/rating")
public ResponseEntity<Void> updateSellerRating(...) { ... } // ← NO @PreAuthorize
```

**Risk:** Any anonymous caller can POST to `PUT /api/v1/users/sellers/1/stats?revenueDelta=999999&itemsSoldDelta=9999` and inflate any seller's stats or rating. This is a public-facing API gateway endpoint.

**Fix:** At minimum add `@PreAuthorize("isAuthenticated()")`. Ideally, these should only be callable by other internal services using a shared service-to-service secret or by restricting them to an internal network route not exposed via the API Gateway.

---

### 3.3 — `ddl-auto: update` in All Services

**Files:** All `application.yml` files across every service.

```yaml
jpa:
  hibernate:
    ddl-auto: update   # ← Dangerous in production
```

**Risk:** Hibernate's `update` mode can silently drop columns in some edge cases and makes schema changes non-reproducible and non-auditable. In a production or shared database this can cause data loss.

**Fix:** Switch to `validate` or `none` for production, and manage schema changes with **Flyway** or **Liquibase**.

```yaml
jpa:
  hibernate:
    ddl-auto: validate   # let Flyway/Liquibase own the schema
```

---

### 3.4 — Password Reset Link is Hardcoded to localhost

**File:** `bagify-backend/user/src/main/java/com/mycompany/app/user/service/UserService.java` (line 371)

```java
// In a real app, the base URL should be in properties  ← comment acknowledges the problem
String resetLink = "http://localhost:5173/reset-password?token=" + token;
```

**Risk:** Password-reset emails sent to any real user will contain a non-functional `localhost` link.

**Fix:**
```java
@Value("${app.frontend-url:http://localhost:5173}")
private String frontendUrl;

String resetLink = frontendUrl + "/reset-password?token=" + token;
```

---

### 3.5 — `show-sql: true` Left On in All Services

**Files:** All `application.yml` files.

```yaml
show-sql: true
```

**Risk:** Every SQL query (including those containing user emails and sensitive data) is printed to `stdout`/log files. In production, this fills logs with noise and can expose PII in log aggregation systems.

**Fix:** Remove `show-sql: true` from production config, or set it only in a `dev` profile.

---

### 3.6 — OTP Printed to Console in Production Code

**File:** `UserService.java` (line 97)

```java
System.out.println("🔑 Generated OTP for " + savedUser.getEmail() + " is: " + otp);
```

**Risk:** OTPs are one-time security codes. Printing them to logs defeats their purpose and exposes them to anyone with log access.

**Fix:** Remove this line entirely, or guard it:
```java
// Only in dev profile
if (log.isDebugEnabled()) {
    log.debug("OTP generated for {}", savedUser.getEmail());
}
```

---

### 3.7 — RuntimeException Used for Business Logic Errors

**File:** `UserService.java` (throughout)

```java
throw new RuntimeException("Email address already in use");
throw new RuntimeException("User not found");
throw new RuntimeException("Invalid or expired refresh token");
```

**Risk:** `RuntimeException` is not caught by the `GlobalExceptionHandler`, so these will produce a generic **500 Internal Server Error** response to the client instead of a meaningful **400/401/404**. This hides bugs and gives bad UX.

**Fix:** Use the custom exceptions already defined in the project:
```java
throw new IllegalArgumentException("Email address already in use");    // 400
throw new ResourceNotFoundException("User not found");                  // 404
throw new InvalidCredentialsException("Invalid or expired token");      // 401
```
Also extend `GlobalExceptionHandler` to cover `ResourceNotFoundException` with a proper 404 response.

---

## 4. 🟡 Medium Priority Issues

---

### 4.1 — `AdminDashboard.tsx` is 1,421 Lines — God Component

**File:** `src/components/AdminDashboard.tsx` (1,421 lines, ~78 KB)

The entire admin panel — overview, products table, users table, orders table, verification queue, filtering logic, modal state — is crammed into one component. This makes it extremely hard to test, debug, and extend.

**Fix:** Split into focused components:
```
AdminDashboard/
  ├── AdminDashboard.tsx       (shell + tab routing only)
  ├── tabs/
  │   ├── OverviewTab.tsx
  │   ├── ProductsTab.tsx
  │   ├── UsersTab.tsx
  │   ├── OrdersTab.tsx
  │   └── VerificationsTab.tsx
  └── hooks/
      ├── useAdminUsers.ts
      └── useAdminOrders.ts
```

Similarly, `SellerDashboard.tsx` (73 KB) and `SellerAnalytics.tsx` (58 KB) need the same treatment.

---

### 4.2 — `AuthService.java` is an Empty File

**File:** `bagify-backend/user/src/main/java/com/mycompany/app/user/service/AuthService.java`

```java
public class AuthService {
}
```

All authentication logic lives in `UserService.java`, which now has 572 lines and mixes auth concerns (register, login, OTP, password reset, token refresh) with profile management (update, delete, stats). This violates the **Single Responsibility Principle**.

**Fix:** Move `register`, `authenticate`, `verifyOtp`, `refreshToken`, `forgotPassword`, and `resetPassword` into `AuthService`, and inject it into `AuthController`.

---

### 4.3 — `GlobalExceptionHandler` Does Not Handle `ResourceNotFoundException`

**File:** `GlobalExceptionHandler.java`

`ResourceNotFoundException` is thrown in many places (`UserService`, etc.) but there is no `@ExceptionHandler` for it. It will fall through as a 500.

**Fix:**
```java
@ExceptionHandler(ResourceNotFoundException.class)
public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
    Map<String, String> response = new HashMap<>();
    response.put("error", "Not Found");
    response.put("message", ex.getMessage());
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
}
```

---

### 4.4 — Mock Data Still Lives in `types/index.ts`

**File:** `src/types/index.ts` (lines 181–392)

`mockSellers`, `mockBuyers`, `mockReviews`, `mockProducts`, `mockOrders` are declared inside the shared types file. This couples type definitions with development test data.

**Fix:**
- Move mock data to `src/data/mockData.ts` (a `data/` folder already exists — use it!).
- `src/types/index.ts` should contain **only** TypeScript interfaces and types.

---

### 4.5 — Cloudinary Upload Preset Exposed on Client Side

**File:** `src/services/cloudinaryservice.ts` (line 2), `.env`

```ts
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "bagify_profiles";
```

An **unsigned upload preset** is used, meaning anyone can upload arbitrary files to your Cloudinary account using your cloud name + preset. This can drain your Cloudinary storage/bandwidth quota.

**Fix:** Use a **signed upload** strategy: have the backend generate a signed upload signature, which the client uses to upload. The preset/API secret never reaches the browser.

---

### 4.6 — `registerLogout` is Called on Every Render in `AuthProvider`

**File:** `src/contexts/AuthProvider.tsx` (line 78)

```tsx
// This is outside any useEffect — runs on every render
registerLogout(logout);
```

`registerLogout` writes to a module-level variable on every render. While functionally acceptable now (it always writes the same reference), it is an anti-pattern. The `logout` function is also recreated without `useCallback`, causing this to write unnecessarily.

**Fix:**
```tsx
const logout = useCallback(() => { ... }, []);

useEffect(() => {
  registerLogout(logout);
}, [logout]);
```

---

### 4.7 — No Input Validation Annotations Used on DTOs

**Files:** Most DTO classes in the user service

`RegisterRequest`, `LoginRequest` etc. import `jakarta.validation` but most fields lack constraint annotations like `@NotBlank`, `@Email`, `@Size`. The `@Valid` annotation on controller methods does nothing if the DTO fields have no constraints.

**Fix:**
```java
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    @NotBlank(message = "Password is required")
    private String password;
    // ...
}
```

---

### 4.8 — SSE Token Passed as URL Query Parameter

**File:** `src/contexts/AuthProvider.tsx` (line 99)

```tsx
const sseUrl = `/api/v1/users/verifications/stream?token=${encodeURIComponent(token)}`;
```

Passing a JWT in a URL query parameter is a security risk. URLs are logged in browser history, server access logs, and proxy logs. The token can leak.

**Fix:** Use a short-lived SSE ticket/nonce: call an endpoint to get a one-time token, then pass that to the SSE URL. Or use a cookie-based auth for the SSE endpoint.

---

### 4.9 — `axios` is a Dead Dependency

**File:** `package.json` (line 13)

```json
"axios": "^1.13.2"
```

`axios` is listed as a production dependency, but the entire project uses the custom `httpClient.ts` built on the native `fetch` API. `axios` is never imported anywhere in the source code.

**Fix:** Remove it: `npm uninstall axios`.

---

## 5. 🟢 Low Priority Issues

---

### 5.1 — `src/data/mockData.ts` File Exists but is Empty/Unused

The `data/` directory exists in the project structure but the mock data that should logically live there is currently in `types/index.ts`. Consolidate and clean up.

---

### 5.2 — `allowedroles` Prop Should Be `allowedRoles` (camelCase)

**File:** `src/routes/ProtectedRoute.tsx` (line 8)

```tsx
interface ProtectedRouteProps {
  allowedroles?: ("BUYER" | "SELLER" | "ADMIN")[];
}
```

HTML attributes are lowercase but this is a React component prop — TypeScript convention is `camelCase`. It should be `allowedRoles`.

---

### 5.3 — `Product.tsx` and `ProductDetail.tsx` Both Exist — Unclear Separation

Two files — `ProductDetail.tsx` and `ProductDetailPage.tsx` — seem to overlap. The naming is confusing; the review of routes shows `ProductDetailPage` is used in routing, making `ProductDetail.tsx` a sub-component. Rename it clearly: e.g., `ProductDetailCard.tsx`.

---

### 5.4 — Debug `console.log` Statements in Production Code

**File:** `AuthProvider.tsx` (lines 82–85)

```tsx
console.log('🔐 Updating user:', updatedUser.email);
console.log('🔐 New profile image:', updatedUser.profileImage);
```

Also found in `cloudinaryservice.ts` (multiple `console.log` calls with emoji). Remove or replace with a proper logging utility that is silent in production.

---

### 5.5 — `@types/react-router-dom` v5 Used With react-router-dom v7

**File:** `package.json`

```json
"react-router-dom": "^7.13.1",
"@types/react-router-dom": "^5.3.3"    // ← v5 types for v7 library
```

This type mismatch can cause incorrect TypeScript hints. Since React Router v6+, types are bundled with the package — `@types/react-router-dom` should be removed entirely.

---

### 5.6 — Platform Activity Timeline Shows Static/Hardcoded Data

**File:** `AdminDashboard.tsx` (lines 686–699)

```tsx
{ text: 'New products added to marketplace listings', count: '5 items', ... },
{ text: 'New buyer and seller profiles created', count: '12 accounts', ... },
```

These are hardcoded strings, not real metrics. Either connect them to live data or label them clearly as placeholder content.

---

### 5.7 — `via.placeholder.com` Used as Fallback Image

**File:** `AdminDashboard.tsx` (line 744)

```tsx
(e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
```

`via.placeholder.com` is an external dependency. Use a local SVG fallback or a data-URI instead.

---

### 5.8 — `UserService` Has Full-Import Star (`import com.mycompany.app.user.dto.*`)

**File:** `UserService.java` (line 5)

```java
import com.mycompany.app.user.dto.*;
```

Wildcard imports reduce readability and can cause ambiguity. Use explicit imports.

---

### 5.9 — `product.log` (7.8 MB) Committed to the Repository

**File:** `bagify-backend/product.log`

A 7.8 MB log file is committed to the Git repository. Log files should be in `.gitignore`.

**Fix:** Add to `bagify-backend/.gitignore`:
```
*.log
```
Then remove the file: `git rm --cached product.log order/order.log`.

---

### 5.10 — `generate-token.js` Committed to the Backend Repo Root

**File:** `bagify-backend/generate-token.js`

This appears to be a development utility script. It doesn't belong in the repository root and could expose internal token-generation patterns.

---

## 6. ✅ Industry Best Practices Followed

These are areas where the code does the right thing.

| # | Practice | Where |
|---|----------|--------|
| 1 | **HttpOnly + Secure refresh-token cookie** | `AuthController.java` — refresh token is never exposed to JavaScript, reducing XSS risk |
| 2 | **Access token stored in memory only** | `authToken.ts` — token is in a module-level variable, not `localStorage`, preventing XSS token theft |
| 3 | **Automatic token refresh with request de-duplication** | `tokenRefresher.ts` — concurrent 401s share one refresh promise |
| 4 | **Result<T> pattern for error handling** | `httpClient.ts` — no unhandled `throw`, every call returns a typed `{ ok, data, error }` |
| 5 | **Request timeout with AbortController** | `httpClient.ts` — fetches are aborted after a configurable timeout |
| 6 | **Exponential backoff retry** | `httpClient.ts` — `requestWithRetry` with `calculateBackoff` |
| 7 | **BCrypt password hashing** | `UserService.java` — `passwordEncoder.encode()` everywhere passwords are saved |
| 8 | **JWT secret loaded from config, not hardcoded** | `JwtUtil.java` — uses `@Value("${jwt.secret}")` |
| 9 | **Short-lived access token (15 min)** | `application.properties` — `jwt.expiration-ms=900000` |
| 10 | **Protected routes with role-based access control** | `ProtectedRoute.tsx` + `@PreAuthorize` on backend |
| 11 | **API Gateway as single entry point** | All frontend calls go to `:8080`; frontend doesn't know individual service ports |
| 12 | **Service Discovery with Eureka** | All services register; gateway uses `lb://` URIs |
| 13 | **Microservices with independent databases** | Each service owns its own PostgreSQL schema |
| 14 | **DTO/Entity separation** | Backend uses DTOs (response objects) and never exposes JPA entities directly to the API |
| 15 | **`@JsonIgnore` on sensitive fields** | `password`, `verificationCode`, `passwordResetToken` are never serialized in JSON |
| 16 | **OTP expiry validation** | OTP has a 10-minute expiry, checked on verify |
| 17 | **Lombok to reduce boilerplate** | `@Getter`, `@Setter`, `@RequiredArgsConstructor` used consistently |
| 18 | **`useMemo` for derived stats** | `AdminDashboard.tsx` — `totalRevenue`, `adminEarnings` wrapped in `useMemo` |
| 19 | **Debounced search input** | `AdminDashboard.tsx` — 300 ms debounce on search filter |
| 20 | **Optimistic UI updates** | `handleToggleUserStatus` updates local state before the API call, then reverts on failure |
| 21 | **Real-time updates with SSE** | `AuthProvider.tsx` — seller verification changes pushed via `EventSource` |
| 22 | **Custom hooks for context access** | `useAuth`, `useCart`, `useProduct`, `useWishlist` — clean API surface |
| 23 | **`useCallback` on stable references** | `openLoginModal`, `closeLoginModal`, `updateUser`, `checkAuth` in `AuthProvider` |
| 24 | **CORS configured at gateway level** | `application.yml` (gateway) — not per-service |
| 25 | **Confirm modal before destructive actions** | Delete product, disable user — all guarded by a confirmation dialog |

---

## 7. ❌ Industry Best Practices Missed

| # | Practice Missed | Severity |
|---|----------------|----------|
| 1 | Secrets committed to version control | 🔴 Critical |
| 2 | No database migration tool (Flyway/Liquibase) | 🔴 High |
| 3 | Internal stats endpoints unprotected | 🔴 High |
| 4 | `RuntimeException` used for business errors | 🟡 Medium |
| 5 | No DTO validation constraints (`@NotBlank`, `@Email`) | 🟡 Medium |
| 6 | No integration or end-to-end tests | 🟡 Medium |
| 7 | Only 1 meaningful unit test exists (`UserControllerTest`) | 🟡 Medium |
| 8 | No rate limiting on auth endpoints (login, register) | 🟡 Medium |
| 9 | `AuthService.java` is empty — SRP violated | 🟡 Medium |
| 10 | God components (AdminDashboard 1421 lines) | 🟡 Medium |
| 11 | JWT passed in URL query param for SSE | 🟡 Medium |
| 12 | Cloudinary uses unsigned upload preset | 🟡 Medium |
| 13 | No structured logging (using `System.out.println`) | 🟡 Medium |
| 14 | `show-sql: true` in all environments | 🟡 Medium |
| 15 | No API versioning strategy beyond `/v1` prefix | 🟢 Low |
| 16 | Dead `axios` dependency | 🟢 Low |
| 17 | Log files committed to git | 🟢 Low |
| 18 | Mock data in types file | 🟢 Low |
| 19 | Hardcoded `localhost` reset URL | 🔴 High |
| 20 | OTP logged to console | 🔴 High |

---

## 8. Area-by-Area Breakdown

### 8.1 Security

| Topic | Status | Notes |
|-------|--------|-------|
| Password storage | ✅ Good | BCrypt used correctly |
| JWT access token | ✅ Good | In-memory only, 15 min TTL |
| JWT refresh token | ✅ Good | HttpOnly cookie, 7-day TTL |
| JWT secret management | ❌ Bad | Secret committed in plaintext |
| DB credentials | ❌ Bad | Password committed in plaintext |
| Email credentials | ❌ Bad | Gmail app password committed |
| Unprotected endpoints | ❌ Bad | Stats/rating endpoints open |
| Input validation | ⚠️ Partial | `@Valid` present but no constraints on DTOs |
| Rate limiting | ❌ Missing | No brute-force protection on login |
| CORS | ✅ Good | Configured at gateway |

### 8.2 Backend Code Quality

| Topic | Status | Notes |
|-------|--------|-------|
| Layered architecture | ✅ Good | Controller → Service → Repository |
| Exception handling | ⚠️ Partial | Handler exists but `RuntimeException` bypasses it |
| Transaction management | ✅ Good | `@Transactional` used on multi-step operations |
| Service separation | ❌ Partial | `AuthService` is empty; `UserService` is 572 lines |
| DTO usage | ✅ Good | Entities never directly returned in API responses |
| Logging | ❌ Bad | `System.out.println` instead of SLF4J/Logback |
| Tests | ❌ Minimal | Only 1 real unit test, context-load test, and empty `AuthService` |

### 8.3 Frontend Code Quality

| Topic | Status | Notes |
|-------|--------|-------|
| TypeScript usage | ✅ Good | Strongly typed throughout |
| Component structure | ⚠️ Partial | Some god-components; common/ folder is a good start |
| HTTP client | ✅ Excellent | Custom fetch wrapper with retry, timeout, 401 refresh |
| State management | ✅ Good | React Context used appropriately for this scale |
| Custom hooks | ✅ Good | `useAuth`, `useCart`, `useProduct`, etc. |
| Route protection | ✅ Good | `ProtectedRoute` handles loading, auth, and role check |
| Error boundaries | ❌ Missing | No `<ErrorBoundary>` wrapping critical subtrees |
| Loading states | ✅ Good | Loading indicators on all async operations |
| Dead code | ❌ Present | `axios` dependency unused; `mockData` in wrong file |

### 8.4 DevOps / Configuration

| Topic | Status | Notes |
|-------|--------|-------|
| Docker Compose | ✅ Present | `compose.yaml` exists in backend |
| Environment profiles | ⚠️ Partial | No `application-prod.yml`; all config in one file |
| `.gitignore` | ❌ Incomplete | Log files are committed; secrets not in `.env.example` |
| DB migrations | ❌ Missing | `ddl-auto: update` only |
| CI/CD | ❌ Missing | No pipeline configuration found |

---

## 9. Summary Table

### Fix Priority Order

| Priority | Issue | Effort |
|----------|-------|--------|
| 🔴 P1 | Rotate and remove all committed secrets | Low (30 min) |
| 🔴 P2 | Protect internal stats/rating endpoints | Low (15 min) |
| 🔴 P3 | Remove OTP `System.out.println` | Low (5 min) |
| 🔴 P4 | Fix hardcoded `localhost` reset URL | Low (15 min) |
| 🔴 P5 | Add migration tool (Flyway) | Medium (2–4 hrs) |
| 🟡 P6 | Map all exceptions to custom types + fix handler | Medium (1–2 hrs) |
| 🟡 P7 | Add `@NotBlank`/`@Email` DTO constraints | Low (1 hr) |
| 🟡 P8 | Move auth logic to `AuthService` | Medium (2 hrs) |
| 🟡 P9 | Split `AdminDashboard` / `SellerDashboard` | High (4–8 hrs) |
| 🟡 P10 | Replace `System.out` with SLF4J logging | Low (1 hr) |
| 🟡 P11 | Turn off `show-sql` in production config | Low (5 min) |
| 🟢 P12 | Remove dead `axios` dependency | Low (2 min) |
| 🟢 P13 | Remove log files from git | Low (5 min) |
| 🟢 P14 | Move mock data out of `types/index.ts` | Low (15 min) |
| 🟢 P15 | Fix `allowedroles` → `allowedRoles` naming | Low (10 min) |
| 🟢 P16 | Remove `@types/react-router-dom` v5 | Low (2 min) |

---

*End of Code Review — Bagify Project*
