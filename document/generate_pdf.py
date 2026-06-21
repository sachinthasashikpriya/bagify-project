import os
import sys
import html
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Define Custom Canvas for Page Numbering and Headers/Footers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Draw decorative cover background
            self.saveState()
            # Top primary color accent block
            self.setFillColor(colors.HexColor("#1A365D"))
            self.rect(0, 520, 612, 272, fill=1, stroke=0)
            
            # Gold thin accent strip
            self.setFillColor(colors.HexColor("#DD6B20"))
            self.rect(0, 508, 612, 12, fill=1, stroke=0)
            
            # Bottom light grey aesthetic block
            self.setFillColor(colors.HexColor("#F7FAFC"))
            self.rect(0, 0, 612, 120, fill=1, stroke=0)
            self.restoreState()
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#4A5568"))
        
        # Running Header
        self.drawString(54, 750, "Bagify — Code Review & Viva Preparation Guide")
        self.drawRightString(558, 750, "Microservices E-Commerce Application")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Running Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        self.drawString(54, 40, "Confidential — Academic / Project Review Reference")
        self.line(54, 52, 558, 52)
        
        self.restoreState()

def format_code(text):
    escaped = html.escape(text)
    lines = []
    for line in escaped.split('\n'):
        # preserve leading spaces using HTML non-breaking spaces
        num_spaces = len(line) - len(line.lstrip())
        lines.append('&nbsp;' * num_spaces + line.lstrip())
    return '<br/>'.join(lines)

def make_callout(text, style):
    p = Paragraph(text, style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EBF8FF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('LINELEFT', (0,0), (0,-1), 3, colors.HexColor('#3182CE')),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    return t

def make_code_block(code_text, style):
    p = Paragraph(format_code(code_text), style)
    t = Table([[p]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EDF2F7')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def generate_pdf(output_path):
    # Setup document template with 0.75in margins (54 points)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.white,
        alignment=0, # Left-aligned in the header block
        spaceAfter=10
    )

    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#CBD5E0'),
        alignment=0,
        spaceAfter=30
    )

    cover_meta_label = ParagraphStyle(
        'CoverMetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4A5568')
    )

    cover_meta_val = ParagraphStyle(
        'CoverMetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1A365D'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#2D3748'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    question_style = ParagraphStyle(
        'Question_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#2B6CB0'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#2D3748')
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 35))
    story.append(Paragraph("BAGIFY", cover_title_style))
    story.append(Paragraph("Viva &amp; Code Review Preparation Guide", cover_title_style))
    story.append(Paragraph("Comprehensive Technical Q&amp;A on Microservices, Security, Concurrency, and Payment Integration", cover_subtitle_style))
    
    story.append(Spacer(1, 160))
    
    # Metadata block on the bottom section of cover page
    metadata_data = [
        [Paragraph("PROJECT TITLE:", cover_meta_label), Paragraph("Bagify E-Commerce System", cover_meta_val)],
        [Paragraph("ARCHITECTURE:", cover_meta_label), Paragraph("Distributed Microservices (Spring Boot + React)", cover_meta_val)],
        [Paragraph("FRONTEND STACK:", cover_meta_label), Paragraph("React (Vite) + TypeScript + Tailwind CSS", cover_meta_val)],
        [Paragraph("BACKEND STACK:", cover_meta_label), Paragraph("Spring Boot, Eureka Service Registry, Spring Cloud Gateway", cover_meta_val)],
        [Paragraph("DATABASE:", cover_meta_label), Paragraph("PostgreSQL (Database-per-Service Pattern)", cover_meta_val)],
        [Paragraph("DOCUMENT TYPE:", cover_meta_label), Paragraph("Technical Review &amp; Code Defence Study Guide", cover_meta_val)],
    ]
    t_meta = Table(metadata_data, colWidths=[130, 374])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(PageBreak())

    # ================= TABLE OF CONTENTS / INTRO =================
    story.append(Paragraph("Introduction", h1_style))
    intro_text = (
        "This guide is prepared to help you defend your project in a code review or viva examination. "
        "It provides structured, detailed answers to technical questions about the architecture, security patterns, "
        "concurrency handlers, payment integration, and testing strategies implemented in <b>Bagify</b>.<br/><br/>"
        "Reviewing these questions will help you explain <i>why</i> you made certain design decisions (such as using a "
        "microservices pattern, pessimistic locking, or database denormalization) rather than just stating <i>what</i> the code does."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 10))

    # Core concepts overview
    story.append(Paragraph("Core Technical Highlights of Bagify:", h2_style))
    story.append(Paragraph("• <b>Service Discovery &amp; Gateway:</b> Netflix Eureka server coordinates instances. Spring Cloud Gateway aggregates endpoints under port 8080 and handles CORS.", body_style))
    story.append(Paragraph("• <b>Database-per-Service:</b> High isolation where each service manages its own PostgreSQL schema, utilizing denormalization for order snapshots.", body_style))
    story.append(Paragraph("• <b>Pessimistic Concurrency Control:</b> Uses Spring Data JPA's <code>LockModeType.PESSIMISTIC_WRITE</code> to block double-checkout and race conditions during payment notifications.", body_style))
    story.append(Paragraph("• <b>Secure Payment Webhooks:</b> Validates HMAC/MD5 signatures received from PayHere (Sandbox) server-to-server redirects.", body_style))
    story.append(Paragraph("• <b>Downstream Fault Tolerance:</b> Leverages defensive try-catch boundaries to prevent statistics sync problems from rolling back payment completions.", body_style))
    story.append(Spacer(1, 15))

    # ================= SECTION 1 =================
    story.append(Paragraph("1. Microservices Architecture &amp; System Design", h1_style))
    
    # Q1
    story.append(Paragraph("Q1: Why did you choose a microservices architecture for Bagify instead of a monolith? What are the key benefits and trade-offs in this design?", question_style))
    q1_ans = (
        "<b>Answer:</b> Monolithic applications bundle user profiles, product catalogs, and order management into a single "
        "deployable unit. In contrast, Bagify decomposes these domains into independent microservices (<code>user</code>, "
        "<code>product</code>, <code>order</code>, <code>notification</code>) to achieve:<br/>"
        "1. <b>Fault Isolation:</b> If the <code>order</code> service goes down due to heavy load, buyers can still browse "
        "the catalog (<code>product</code> service) or register accounts (<code>user</code> service).<br/>"
        "2. <b>Independent Scalability:</b> The <code>product</code> service (which receives heavy read traffic) can be scaled "
        "up independently from the heavier write-intensive <code>order</code> service.<br/>"
        "3. <b>Domain Boundaries:</b> Each service handles its own isolated logic. Developers can work on the frontend "
        "or user profiles without risking order logic corruption.<br/><br/>"
        "<b>Trade-offs:</b> Microservices introduce distributed complexity: network latency between services, distributed "
        "transactions (ensuring stock is deducted when an order is paid), and operational overhead (managing multiple databases, "
        "ports, and discovery nodes)."
    )
    story.append(Paragraph(q1_ans, body_style))
    
    # Q2
    story.append(Paragraph("Q2: What is the purpose of Eureka Server, and how do client microservices interact with it?", question_style))
    q2_ans = (
        "<b>Answer:</b> Eureka acts as a <b>Service Registry</b>. In a dynamic environment, services scale up and down, "
        "and their IP addresses or port numbers can change. Hardcoding physical URLs (like <code>localhost:8082</code>) is an "
        "anti-pattern. With Eureka:<br/>"
        "1. At startup, each microservice registers its service name (e.g., <code>spring.application.name=user</code>) "
        "and coordinates with the Eureka server.<br/>"
        "2. When the API Gateway or <code>order</code> service needs to make a call to the <code>user</code> service, it queries "
        "Eureka to resolve the application name to a live IP address and port.<br/>"
        "3. It also enables client-side load balancing (via Spring Cloud LoadBalancer), routing requests among active instances."
    )
    story.append(Paragraph(q2_ans, body_style))

    # Q3
    story.append(Paragraph("Q3: Explain the role of the API Gateway (Spring Cloud Gateway) in Bagify. How does it handle routing and CORS?", question_style))
    q3_ans = (
        "<b>Answer:</b> The API Gateway serves as a single entry point (running on port <code>8080</code>) for the frontend "
        "application. Instead of the React client connecting to multiple ports (8081 for user, 8082 for product, etc.), all "
        "requests go to the Gateway. The Gateway reads the request path and routes it using Eureka name-resolution:<br/>"
        "• Paths matching <code>/api/v1/auth/**</code> are routed to <code>lb://user</code>.<br/>"
        "• Paths matching <code>/api/v1/products/**</code> are routed to <code>lb://product</code>.<br/>"
        "• Paths matching <code>/api/v1/orders/**</code> are routed to <code>lb://order</code>.<br/><br/>"
        "<b>CORS:</b> Cross-Origin Resource Sharing is configured exclusively at the Gateway. It permits incoming requests "
        "from the React client (<code>http://localhost:5173</code>) and sets allowed HTTP methods (GET, POST, PUT, DELETE) and "
        "headers globally. This eliminates the need to configure CORS inside individual downstream microservices."
    )
    story.append(Paragraph(q3_ans, body_style))

    # Q4
    story.append(Paragraph("Q4: Why is a 'Database-per-Service' pattern used? How do you query data across services, such as displaying the product name or seller details in an order history list?", question_style))
    q4_ans = (
        "<b>Answer:</b> Under the Database-per-Service pattern, each microservice owns its private database. The <code>user</code> "
        "service reads <code>bagify_users</code>, the <code>product</code> service reads <code>bagify_products</code>, and "
        "the <code>order</code> service reads <code>bagify_orders</code>. Sharing a database violates encapsulation, "
        "creates tight coupling, and leads to schema change bottlenecks.<br/><br/>"
        "<b>Cross-Domain Queries:</b> Direct database SQL joins are impossible. Instead, we use <b>Denormalization</b>. "
        "When an order is created, rather than storing just the <code>productId</code> and querying the product database "
        "at read-time, the <code>order</code> service stores a snapshot of the product details (name, image, and price at "
        "purchase time) inside the <code>OrderItem</code> entity. This not only preserves data independence but also ensures "
        "that order history remains historically accurate even if the seller later modifies a product's price or description."
    )
    story.append(Paragraph(q4_ans, body_style))
    
    story.append(PageBreak())

    # ================= SECTION 2 =================
    story.append(Paragraph("2. Concurrency Control &amp; Transaction Management", h1_style))
    
    # Q5
    story.append(Paragraph("Q5: Explain how your order checkout process handles inventory management. What happens if two users try to buy the last remaining item at the same time?", question_style))
    q5_ans = (
        "<b>Answer:</b> The order checkout logic implements a two-phase check in <code>OrderService.placeOrder</code>:<br/>"
        "1. <b>Validation:</b> It calls the <code>product</code> service to retrieve stock levels and verifies that the stock is "
        "greater than or equal to the requested quantity.<br/>"
        "2. <b>Deduction:</b> If stock is sufficient, the <code>order</code> service sends an authenticated request to "
        "the <code>product</code> service's stock deduction endpoint to reduce inventory in a transaction.<br/><br/>"
        "To prevent race conditions where two users buy the last item simultaneously, the stock deduction query in the "
        "<code>product</code> service executes an atomic database operation, such as:<br/>"
        "<code>UPDATE products SET stock = stock - :quantity WHERE id = :id AND stock &gt;= :quantity</code>.<br/>"
        "If the updated row count is 0, it indicates that another user's transaction committed first, causing the current "
        "transaction to fail and throw an <code>Insufficient stock</code> error."
    )
    story.append(Paragraph(q5_ans, body_style))

    # Q6
    story.append(Paragraph("Q6: How does the Order Service webhook handle concurrent notifications for the same order (e.g. duplicate signals from the payment gateway)?", question_style))
    q6_ans = (
        "<b>Answer:</b> When a payment is processed, the PayHere payment gateway makes a server-to-server POST request to the "
        "webhook endpoint (<code>/api/v1/orders/payment/notify</code>). Due to network retries or gateway behavior, duplicate "
        "notifications may arrive at the same millisecond. To guarantee <b>Idempotency</b> and prevent race conditions, the system uses "
        "<b>Pessimistic Write Locking</b>.<br/><br/>"
        "The repository method <code>findByIdForUpdate</code> is marked with <code>@Lock(LockModeType.PESSIMISTIC_WRITE)</code>. "
        "When the first thread calls this method, JPA executes a <code>SELECT ... FOR UPDATE</code> query, locking the database row. "
        "The second thread is blocked and must wait."
    )
    story.append(Paragraph(q6_ans, body_style))

    lock_code = (
        "// In OrderRepository.java\n"
        "@Lock(LockModeType.PESSIMISTIC_WRITE)\n"
        "@Query(\"SELECT o FROM Order o WHERE o.id = :id\")\n"
        "Optional<Order> findByIdForUpdate(@Param(\"id\") Long id);"
    )
    story.append(make_code_block(lock_code, code_style))
    
    story.append(Paragraph(
        "Once the first thread releases the lock by committing the transaction, the second thread acquires it. "
        "The second thread evaluates the local payment status flag immediately:<br/>"
        "<code>boolean isAlreadyPaid = \"PAID\".equals(order.getPaymentStatus());</code><br/>"
        "If it is already <code>PAID</code>, the service logs a duplicate event warning and immediately returns without "
        "executing any state transitions, database saves, or downstream microservice calls.",
        body_style
    ))

    # Q7
    story.append(Paragraph("Q7: In OrderService.processPaymentNotification, the call to update user stats is wrapped in a try-catch. What is the design rationale behind this?", question_style))
    q7_ans = (
        "<b>Answer:</b> The payment webhook handles critical financial state transitions (marking an order as <code>PAID</code>). "
        "After marking the order as paid, the system tries to update the seller's statistics in the <code>user</code> microservice "
        "via an HTTP call. If the <code>user</code> microservice is temporarily down or experiences a network timeout, "
        "propagating the exception would roll back the entire transaction. This would revert the order to <code>UNPAID</code> in "
        "our database, even though the buyer has already paid and the gateway has confirmed receipt of funds. We wrap "
        "the call in a try-catch block to maintain system reliability, log the failure, and allow the core transaction (saving the "
        "paid order) to complete successfully."
    )
    story.append(Paragraph(q7_ans, body_style))

    try_catch_code = (
        "// Update seller stats in user microservice\n"
        "try {\n"
        "    Integer sellerId = Integer.parseInt(item.getSellerId());\n"
        "    double itemRevenue = item.getPriceAtPurchase() * item.getQuantity();\n"
        "    userClient.updateSellerStats(sellerId, itemRevenue, item.getQuantity());\n"
        "} catch (Exception e) {\n"
        "    log.error(\"Could not parse seller ID or call UserClient: {}\", e.getMessage());\n"
        "    // Exception caught: order remains marked as PAID!\n"
        "}"
    )
    story.append(make_code_block(try_catch_code, code_style))
    
    story.append(PageBreak())

    # ================= SECTION 3 =================
    story.append(Paragraph("3. Security &amp; Token Propagation", h1_style))
    
    # Q8
    story.append(Paragraph("Q8: How is JWT-based authentication implemented and validated across your microservices? How is the user profile extracted?", question_style))
    q8_ans = (
        "<b>Answer:</b> The architecture uses stateless JWT (JSON Web Token) authentication:<br/>"
        "1. <b>Generation:</b> The <code>user</code> service generates a JWT signed with a secret key upon a successful login. "
        "The token contains claims: <code>userId</code>, <code>email</code>, and <code>roles</code>.<br/>"
        "2. <b>Validation:</b> Downstream services (e.g., <code>order</code>, <code>product</code>) contain a <code>JwtFilter</code> "
        "that intercepts incoming HTTP requests, extracts the <code>Authorization: Bearer &lt;token&gt;</code> header, decodes it "
        "using the shared secret, and validates its expiry and signature.<br/>"
        "3. <b>Context Extraction:</b> Once validated, the filter parses the roles (e.g. <code>ROLE_BUYER</code>) and user ID, and "
        "populates the Spring Security <code>SecurityContext</code>. Controllers access the user ID via "
        "<code>authentication.getDetails()</code>."
    )
    story.append(Paragraph(q8_ans, body_style))

    # Q9
    story.append(Paragraph("Q9: What is 'Token Propagation' and how is it used during the checkout process?", question_style))
    q9_ans = (
        "<b>Answer:</b> When a buyer calls the <code>order</code> service to check out, the request is authenticated with their JWT. "
        "However, to validate stock and deduct inventory, the <code>order</code> service must make a synchronous REST call to "
        "the <code>product</code> service. The <code>product</code> service endpoints are secured and require authentication. "
        "<b>Token Propagation</b> is the pattern where the <code>order</code> service extracts the user's incoming JWT "
        "and forwards it in the headers of its outgoing HTTP client (<code>WebClient</code> or <code>RestTemplate</code>) "
        "to the <code>product</code> service. This maintains security context across microservice boundaries."
    )
    story.append(Paragraph(q9_ans, body_style))

    prop_code = (
        "// In OrderController.java - Forwarding the JWT\n"
        "String bearerToken = httpRequest.getHeader(\"Authorization\");\n"
        "OrderResponse response = orderService.placeOrder(buyerId, request, bearerToken);\n"
        "\n"
        "// In ProductClient.java - Passing the Bearer Token\n"
        "public void deductStock(Long productId, int quantity, String bearerToken) {\n"
        "    webClient.put()\n"
        "        .uri(\"/api/v1/products/\" + productId + \"/deduct-stock?quantity=\" + quantity)\n"
        "        .header(\"Authorization\", bearerToken) // Token propagated here!\n"
        "        .retrieve()\n"
        "        .toBodilessEntity().block();\n"
        "}"
    )
    story.append(make_code_block(prop_code, code_style))

    # Q10
    story.append(Paragraph("Q10: How do you restrict specific endpoints to Sellers or Admins only?", question_style))
    q10_ans = (
        "<b>Answer:</b> We configure method-level security in our Spring Boot configuration using <code>@EnableMethodSecurity</code> "
        "and apply the <code>@PreAuthorize</code> annotation. For example, updating the status of an order item is restricted "
        "to sellers, whereas overriding an item's status to <code>DELIVERED</code> is restricted to admins."
    )
    story.append(Paragraph(q10_ans, body_style))

    auth_code = (
        "@PutMapping(\"/{orderId}/items/{itemId}/status\")\n"
        "@PreAuthorize(\"hasRole('SELLER')\")\n"
        "public ResponseEntity<OrderResponse> updateItemStatus(...) { ... }\n"
        "\n"
        "@PutMapping(\"/{orderId}/items/{itemId}/status/admin\")\n"
        "@PreAuthorize(\"hasRole('ADMIN')\")\n"
        "public ResponseEntity<OrderResponse> updateItemStatusAdmin(...) { ... }"
    )
    story.append(make_code_block(auth_code, code_style))
    
    story.append(PageBreak())

    # ================= SECTION 4 =================
    story.append(Paragraph("4. Payment Gateway Integration (PayHere)", h1_style))
    
    # Q11
    story.append(Paragraph("Q11: How do you prevent a user from tampering with order details (like changing the currency or reducing the amount) before redirecting to the PayHere payment page?", question_style))
    q11_ans = (
        "<b>Answer:</b> We generate an MD5 cryptographic signature hash on the backend, which is passed to the frontend and "
        "submitted directly to PayHere. The hash is calculated as:<br/>"
        "<code>MD5(Merchant ID + Order ID + Formatted Amount + Currency + MD5(Merchant Secret))</code>.<br/>"
        "When the user is redirected, PayHere's servers recalculate the hash using the parameters sent and the merchant secret "
        "known only to PayHere and our backend. If the user tampered with the price in the browser, the hashes will not "
        "match, and PayHere will reject the transaction immediately. The merchant secret is stored in application properties "
        "and is never exposed to the frontend."
    )
    story.append(Paragraph(q11_ans, body_style))

    # Q12
    story.append(Paragraph("Q12: Explain the validation steps performed when receiving the server-to-server webhook callback from PayHere.", question_style))
    q12_ans = (
        "<b>Answer:</b> The callback in <code>OrderService.processPaymentNotification</code> implements strict verification steps:<br/>"
        "1. <b>Parameter Check:</b> It verifies that all required parameters (merchant ID, order ID, amount, currency, status code, "
        "and the signature hash <code>md5sig</code>) are present.<br/>"
        "2. <b>Signature Recalculation:</b> It generates a signature hash of the incoming parameters using the formula:<br/>"
        "<code>MD5(Merchant ID + Order ID + PayHere Amount + PayHere Currency + Status Code + MD5(Merchant Secret))</code>.<br/>"
        "3. <b>Case-Insensitive Match:</b> It compares our calculated hash with the <code>md5sig</code> sent by PayHere, ignoring case "
        "(to handle variance in hexadecimal formatting between systems). If they don't match, it throws a 400 Bad Request error.<br/>"
        "4. <b>Order Fetch and Lock:</b> It fetches the corresponding order using a pessimistic lock (preventing concurrent updates).<br/>"
        "5. <b>Payment Evaluation:</b> It checks if the order has already been marked as <code>PAID</code> to prevent duplicate processing."
    )
    story.append(Paragraph(q12_ans, body_style))

    # Q13
    story.append(Paragraph("Q13: How is the PayHere signature generator implemented in your utility classes?", question_style))
    story.append(Paragraph("<b>Answer:</b> It uses Java's <code>MessageDigest</code> library to calculate the MD5 hash and formats the resulting bytes into a hexadecimal string.", body_style))
    
    hash_code = (
        "public static String generateMd5(String source) {\n"
        "    try {\n"
        "        MessageDigest md = MessageDigest.getInstance(\"MD5\");\n"
        "        byte[] messageDigest = md.digest(source.getBytes());\n"
        "        StringBuilder sb = new StringBuilder();\n"
        "        for (byte b : messageDigest) {\n"
        "            sb.append(String.format(\"%02x\", b));\n"
        "        }\n"
        "        return sb.toString().toUpperCase();\n"
        "    } catch (NoSuchAlgorithmException e) {\n"
        "        throw new RuntimeException(e);\n"
        "    }\n"
        "}"
    )
    story.append(make_code_block(hash_code, code_style))
    
    story.append(PageBreak())

    # ================= SECTION 5 =================
    story.append(Paragraph("5. Frontend Architecture &amp; State Management", h1_style))
    
    # Q14
    story.append(Paragraph("Q14: How is state management structured in the React frontend? What is the role of Context Providers?", question_style))
    q14_ans = (
        "<b>Answer:</b> The React application uses the Context API for lightweight, global state management without the "
        "boilerplate of Redux. Context Providers wrap the component tree in <code>App.tsx</code>:<br/>"
        "• <code>AuthProvider</code>: Manages the active user's session, JWT, role, and details, persisting them to <code>localStorage</code>.<br/>"
        "• <code>ProductProvider</code>: Exposes the catalog, search queries, category filters, and product CRUD methods.<br/>"
        "• <code>CartProvider</code>: Tracks items added to the shopping cart, calculates subtotals, and facilitates checkout.<br/>"
        "• <code>WishlistProvider</code>: Keeps track of items the buyer has bookmarked."
    )
    story.append(Paragraph(q14_ans, body_style))

    # Q15
    story.append(Paragraph("Q15: How are routes secured in React? How do you prevent a buyer from manually accessing the admin dashboard via URL manipulation?", question_style))
    q15_ans = (
        "<b>Answer:</b> We built a custom <code>ProtectedRoute</code> component that wraps sensitive route definitions in "
        "<code>AppRoutes.tsx</code>. It queries the <code>AuthProvider</code> to inspect the user's login status and role:<br/>"
        "1. If the user is not authenticated, they are redirected to the login page.<br/>"
        "2. If the route specifies an <code>allowedroles</code> property (e.g. <code>['ADMIN']</code>) and the user's role does not match, "
        "they are redirected to a 'Not Authorized' or home page.<br/>"
        "This secures the UI layer, preventing unauthorized users from rendering administrative views."
    )
    story.append(Paragraph(q15_ans, body_style))

    # Q16
    story.append(Paragraph("Q16: Why did you choose Vite over Create React App (CRA)?", question_style))
    q16_ans = (
        "<b>Answer:</b> Vite is a modern frontend build tool. It uses native ES modules in development, enabling "
        "extremely fast server starts and instant Hot Module Replacement (HMR) regardless of project size. Production builds "
        "are powered by Rollup, which produces cleaner, smaller bundles than Create React App's Webpack configuration. "
        "Additionally, Vite is highly configurable and includes built-in support for TypeScript out of the box."
    )
    story.append(Paragraph(q16_ans, body_style))
    
    story.append(Spacer(1, 10))

    # ================= SECTION 6 =================
    story.append(Paragraph("6. Testing Strategy", h1_style))
    
    # Q17
    story.append(Paragraph("Q17: What was your strategy for testing the payment webhook logic? What edge cases did you cover?", question_style))
    q17_ans = (
        "<b>Answer:</b> We wrote Mockito unit tests in <code>OrderServiceWebhookTest.java</code> to isolate the service logic from the database "
        "and external REST clients. The tests validated several scenarios:<br/>"
        "1. <b>Successful Webhook:</b> Mocked a valid signature and status code <code>2</code>. Verified that the order transitioned to "
        "<code>PROCESSING</code> and the payment status to <code>PAID</code>.<br/>"
        "2. <b>Tamper Detection:</b> Simulated a request where the payment amount was altered, and verified that hash validation failed.<br/>"
        "3. <b>Idempotency (Duplicate Request):</b> Passed an order that was already marked as <code>PAID</code>, and verified that the service "
        "bypassed saving the order or invoking downstream APIs.<br/>"
        "4. <b>Downstream Failure:</b> Configured the user client to throw a network exception during the update, and verified that the order "
        "was still successfully saved as paid."
    )
    story.append(Paragraph(q17_ans, body_style))

    test_snippet = (
        "// Testing duplicate webhooks\n"
        "@Test\n"
        "void testProcessPaymentNotification_DuplicatePaidWebhook_SuccessStatus() {\n"
        "    // Arrange: Order is already marked as PAID\n"
        "    Order order = new Order();\n"
        "    order.setPaymentStatus(\"PAID\");\n"
        "    when(orderRepository.findByIdForUpdate(45L)).thenReturn(Optional.of(order));\n"
        "\n"
        "    // Act: Process the webhook\n"
        "    orderService.processPaymentNotification(params);\n"
        "\n"
        "    // Assert: Verify order save and user client calls were bypassed\n"
        "    verify(orderRepository, never()).save(any());\n"
        "    verifyNoInteractions(userClient);\n"
        "}"
    )
    story.append(make_code_block(test_snippet, code_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)

if __name__ == "__main__":
    output_pdf = "/media/sachintha/New Volume/University materials/L3S1/Individual project/bagify_viva_questions.pdf"
    if len(sys.argv) > 1:
        output_pdf = sys.argv[1]
    
    print(f"Generating PDF at {output_pdf}...")
    generate_pdf(output_pdf)
    print("PDF generation complete!")
