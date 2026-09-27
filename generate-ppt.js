const pptxgen = require('pptxgenjs');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// SETUP: Create assets directory
// ============================================================================
const assetsDir = path.join(__dirname, 'ppt-assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// ============================================================================
// LOGO DOWNLOADING
// ============================================================================
function downloadLogo(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(assetsDir, filename);
    if (fs.existsSync(filepath)) {
      console.log(`✓ ${filename} already exists`);
      resolve(filepath);
      return;
    }
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded ${filename}`);
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

function generatePlaceholderLogo(color, letter, filename) {
  const filepath = path.join(assetsDir, filename);
  if (fs.existsSync(filepath)) return Promise.resolve(filepath);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <circle cx="128" cy="128" r="120" fill="#${color}"/>
    <text x="128" y="145" font-family="Arial" font-size="120" font-weight="bold" fill="white" text-anchor="middle">${letter}</text>
  </svg>`;
  fs.writeFileSync(filepath.replace('.png', '.svg'), svg);
  return Promise.resolve(filepath.replace('.png', '.svg'));
}

// ============================================================================
// MAIN PRESENTATION BUILDER
// ============================================================================
async function main() {
  console.log('🎨 Generating Ticket Stampede Presentation...\n');

  // Download tech logos
  console.log('📥 Downloading technology logos...');
  try {
    await Promise.all([
      downloadLogo('https://cdn.simpleicons.org/nodedotjs/539E43', 'nodejs.svg'),
      downloadLogo('https://cdn.simpleicons.org/fastify/000000', 'fastify.svg'),
      downloadLogo('https://cdn.simpleicons.org/postgresql/336791', 'postgresql.svg'),
      downloadLogo('https://cdn.simpleicons.org/docker/2496ED', 'docker.svg'),
    ]);
  } catch (err) {
    console.log('️  Logo download failed, using placeholders');
    await Promise.all([
      generatePlaceholderLogo('539E43', 'N', 'nodejs.svg'),
      generatePlaceholderLogo('000000', 'F', 'fastify.svg'),
      generatePlaceholderLogo('336791', 'P', 'postgresql.svg'),
      generatePlaceholderLogo('2496ED', 'D', 'docker.svg'),
    ]);
  }

  // Initialize presentation
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.author = 'Suthikshan';
  pres.title = 'Ticket Stampede: High-Concurrency Ticketing System';

  // ============================================================================
  // COLOR PALETTE & FONTS
  // ============================================================================
  const NAVY = '1B2A4A';
  const CORAL = 'E8543E';
  const GOLD = 'FFB238';
  const WHITE = 'FFFFFF';
  const LIGHT = 'F4F6FA';
  const DARK = '0F1A2E';
  const GREEN = '1F9D55';
  const BLUE = '5B8DEF';
  const MUTED = '6B7A99';
  const HEAD = 'Calibri';
  const BODY = 'Calibri';

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  function addBg(slide, color) {
    slide.background = { color };
  }

  function addTitle(slide, text, color = WHITE) {
    slide.addText(text, {
      x: 0.8, y: 0.4, w: 11.5, h: 0.8,
      fontFace: HEAD, fontSize: 36, bold: true, color,
      isTextBox: true, margin: 0
    });
  }

  function addSubtitle(slide, text, color = MUTED) {
    slide.addText(text, {
      x: 0.8, y: 1.2, w: 11.5, h: 0.5,
      fontFace: BODY, fontSize: 16, color,
      isTextBox: true, margin: 0
    });
  }

  function addCard(slide, x, y, w, h, title, body, iconColor = CORAL) {
    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w, h,
      fill: { color: WHITE },
      shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.1 },
      rectRadius: 0.15
    });
    slide.addShape(pres.ShapeType.rect, {
      x, y, w: 0.08, h,
      fill: { color: iconColor }
    });
    slide.addText(title, {
      x: x + 0.3, y: y + 0.15, w: w - 0.5, h: 0.4,
      fontFace: HEAD, fontSize: 14, bold: true, color: NAVY,
      isTextBox: true, margin: 0
    });
    slide.addText(body, {
      x: x + 0.3, y: y + 0.55, w: w - 0.5, h: h - 0.7,
      fontFace: BODY, fontSize: 11, color: '333333',
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
    });
  }

  function addStatBox(slide, x, y, w, h, number, label, color = CORAL) {
    slide.addShape(pres.ShapeType.roundRect, {
      x, y, w, h,
      fill: { color: WHITE },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 },
      rectRadius: 0.12
    });
    slide.addText(number, {
      x, y: y + 0.15, w, h: 0.6,
      fontFace: HEAD, fontSize: 32, bold: true, color,
      align: 'center', isTextBox: true, margin: 0
    });
    slide.addText(label, {
      x, y: y + 0.75, w, h: 0.4,
      fontFace: BODY, fontSize: 10, color: MUTED,
      align: 'center', isTextBox: true, margin: 0
    });
  }

  function addLogoOrPlaceholder(slide, logoPath, x, y, size, color, letter) {
    if (fs.existsSync(logoPath)) {
      slide.addImage({ path: logoPath, x, y, w: size, h: size });
    } else {
      slide.addShape(pres.ShapeType.ellipse, {
        x, y, w: size, h: size,
        fill: { color }
      });
      slide.addText(letter, {
        x, y, w: size, h: size,
        fontFace: HEAD, fontSize: 28, bold: true, color: WHITE,
        align: 'center', valign: 'middle', isTextBox: true, margin: 0
      });
    }
  }

  // ============================================================================
  // SLIDE 1: TITLE
  // ============================================================================
  console.log('📄 Slide 1: Title');
  let s = pres.addSlide();
  addBg(s, DARK);
  s.addShape(pres.ShapeType.rect, { x: 0, y: 3.2, w: 13.3, h: 0.06, fill: { color: GOLD } });
  s.addText('TICKET STAMPEDE', {
    x: 0.8, y: 1.2, w: 11.5, h: 1.2,
    fontFace: HEAD, fontSize: 52, bold: true, color: WHITE,
    isTextBox: true, margin: 0
  });
  s.addText('High-Concurrency Ticketing System', {
    x: 0.8, y: 2.4, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 22, color: GOLD,
    isTextBox: true, margin: 0
  });
  s.addText('Building a fault-tolerant backend that survives race conditions, database crashes, and massive traffic spikes — without losing a single ticket.', {
    x: 0.8, y: 3.6, w: 10, h: 1.0,
    fontFace: BODY, fontSize: 14, color: 'AAB8D0',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
  });
  s.addText('Node.js  |  Fastify  |  PostgreSQL  |  Docker', {
    x: 0.8, y: 5.5, w: 11.5, h: 0.5,
    fontFace: BODY, fontSize: 14, color: MUTED,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 2: AGENDA
  // ============================================================================
  console.log(' Slide 2: Agenda');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Agenda', NAVY);
  addSubtitle(s, 'What we will cover in this presentation');
  const agendaItems = [
    ['01', 'The Problem', 'Why concurrent ticket selling is hard'],
    ['02', 'Sub-Problems', 'Breaking the challenge into testable pieces'],
    ['03', 'System Architecture', 'Component design and tech stack'],
    ['04', 'The Solution', 'Database locking, CTEs, and idempotency'],
    ['05', 'Test Results', 'Proof of correctness under extreme load'],
    ['06', 'Failure Recovery', 'Surviving database crashes mid-sale'],
    ['07', 'Key Takeaways', 'Lessons learned and trade-offs'],
  ];
  agendaItems.forEach((item, i) => {
    const y = 2.0 + i * 0.72;
    s.addShape(pres.ShapeType.ellipse, { x: 1.0, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: i < 2 ? CORAL : NAVY } });
    s.addText(item[0], { x: 1.0, y: y + 0.05, w: 0.45, h: 0.45, fontFace: HEAD, fontSize: 13, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(item[1], { x: 1.7, y, w: 3, h: 0.3, fontFace: HEAD, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(item[2], { x: 1.7, y: y + 0.28, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, color: MUTED, isTextBox: true, margin: 0 });
  });

  // ============================================================================
  // SLIDE 3: THE PROBLEM
  // ============================================================================
  console.log('📄 Slide 3: The Problem');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'The Problem', WHITE);
  s.addText('Imagine selling 100 concert tickets to 50,000 people in 60 seconds.', {
    x: 0.8, y: 1.3, w: 11, h: 0.5,
    fontFace: BODY, fontSize: 18, color: GOLD,
    isTextBox: true, margin: 0
  });
  addCard(s, 0.8, 2.2, 5.5, 2.0, 'The Challenge', '50,000 users click "Buy" at the exact same millisecond. Your server must ensure:\n\n• Exactly 100 tickets are sold (not 101)\n• Each ticket goes to exactly one person\n• Duplicate clicks don\'t create duplicate tickets\n• The system survives database crashes', CORAL);
  addCard(s, 6.8, 2.2, 5.5, 2.0, 'Why It Matters', 'Real-world platforms like BookMyShow, IRCTC, and Swiggy face this exact problem daily. A single race condition can cause:\n\n• Revenue loss from overselling\n• Customer trust erosion\n• Legal liability from double-bookings', GOLD);
  s.addText('Core Question: How do you prevent two people from buying the same seat at the exact same moment?', {
    x: 0.8, y: 4.8, w: 11.5, h: 0.8,
    fontFace: BODY, fontSize: 14, italic: true, color: 'AAB8D0',
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 4: WHY THIS PROBLEM
  // ============================================================================
  console.log('📄 Slide 4: Why This Problem');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Why I Chose This Problem', NAVY);
  addCard(s, 0.8, 1.8, 3.6, 2.5, 'Real-World Relevance', 'Every major platform (IRCTC, BookMyShow, Zomato) solves this exact problem. It is the backbone of e-commerce.', CORAL);
  addCard(s, 4.8, 1.8, 3.6, 2.5, 'Engineering Depth', 'Tests concurrency, database design, distributed systems, failure recovery, and observability — all in one project.', NAVY);
  addCard(s, 8.8, 1.8, 3.6, 2.5, 'Measurable Proof', 'Backend correctness can be mathematically proven with load tests and invariant checks.', GREEN);
  s.addText('This project demonstrates the difference between "it works on my machine" and "it survives production."', {
    x: 0.8, y: 5.0, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 14, italic: true, color: MUTED,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 5: SUB-PROBLEMS
  // ============================================================================
  console.log('📄 Slide 5: Sub-Problems');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Breaking Down the Problem', NAVY);
  addSubtitle(s, 'Four distinct sub-problems, each requiring a different solution');
  addCard(s, 0.8, 1.9, 5.5, 2.2, '1. Race Conditions', 'Two users grab the same ticket simultaneously. The "check-then-act" pattern fails under concurrency. Need atomic database operations.', CORAL);
  addCard(s, 6.8, 1.9, 5.5, 2.2, '2. Idempotency', 'Network drops after payment. User retries. System must return the same ticket, not a new one. Need request-level deduplication.', GOLD);
  addCard(s, 0.8, 4.4, 5.5, 2.2, '3. Failure Recovery', 'Database crashes mid-sale. In-flight transactions are interrupted. System must not lose confirmed sales or crash the server.', NAVY);
  addCard(s, 6.8, 4.4, 5.5, 2.2, '4. Observability', 'How do you prove the system recovered? Need forensic tooling to analyze thousands of request attempts automatically.', GREEN);

  // ============================================================================
  // SLIDE 6: THE 4 INVARIANTS
  // ============================================================================
  console.log('📄 Slide 6: The 4 Invariants');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'The 4 Invariants (Rules That Must NEVER Break)', WHITE);
  const invariants = [
    ['INV 1', 'Never Oversell', 'sold <= ticket_count always', CORAL],
    ['INV 2', 'No Duplicate Tickets', 'Each ticket number issued once', GOLD],
    ['INV 3', 'Idempotency', 'Same request_id = same ticket', GREEN],
    ['INV 4', 'No Lost Sales', 'Confirmed sales survive crashes', BLUE],
  ];
  invariants.forEach((inv, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.8, w: 2.8, h: 4.5, fill: { color: '1A2744' }, rectRadius: 0.15 });
    s.addShape(pres.ShapeType.rect, { x, y: 1.8, w: 2.8, h: 0.08, fill: { color: inv[3] } });
    s.addText(inv[0], { x, y: 2.1, w: 2.8, h: 0.5, fontFace: HEAD, fontSize: 14, bold: true, color: inv[3], align: 'center', isTextBox: true, margin: 0 });
    s.addText(inv[1], { x, y: 2.7, w: 2.8, h: 0.5, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, align: 'center', isTextBox: true, margin: 0 });
    s.addText(inv[2], { x: x + 0.2, y: 3.4, w: 2.4, h: 1.0, fontFace: BODY, fontSize: 11, color: 'AAB8D0', align: 'center', isTextBox: true, margin: 0 });
  });

  // ============================================================================
  // SLIDE 7: TECH STACK
  // ============================================================================
  console.log(' Slide 7: Tech Stack');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Technology Stack', NAVY);
  addSubtitle(s, 'Each technology chosen for a specific reason');
  const tech = [
    ['Node.js', 'Non-blocking I/O for 1000+ concurrent connections', '539E43', path.join(assetsDir, 'nodejs.svg')],
    ['Fastify', '2-3x faster than Express, low overhead routing', '000000', path.join(assetsDir, 'fastify.svg')],
    ['PostgreSQL', 'ACID compliance, row-level locking, partial indexes', '336791', path.join(assetsDir, 'postgresql.svg')],
    ['Docker', 'Isolated database for reproducible kill/restart tests', '2496ED', path.join(assetsDir, 'docker.svg')],
  ];
  tech.forEach((t, i) => {
    const x = 0.8 + i * 3.1;
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.0, w: 2.8, h: 3.5,
      fill: { color: WHITE },
      shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 },
      rectRadius: 0.15
    });
    addLogoOrPlaceholder(s, t[3], x + 0.9, 2.3, 1.0, t[2], t[0].charAt(0));
    s.addText(t[0], {
      x, y: 3.5, w: 2.8, h: 0.4,
      fontFace: HEAD, fontSize: 16, bold: true, color: NAVY,
      align: 'center', isTextBox: true, margin: 0
    });
    s.addText(t[1], {
      x: x + 0.2, y: 4.0, w: 2.4, h: 1.2,
      fontFace: BODY, fontSize: 10, color: MUTED,
      align: 'center', isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
    });
  });

  // ============================================================================
  // SLIDE 8: SYSTEM ARCHITECTURE (WITH DIAGRAM IMAGE)
  // ============================================================================
  console.log('📄 Slide 8: System Architecture');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'System Architecture', NAVY);
  addSubtitle(s, 'Buyer → Seller → PostgreSQL flow with atomic CTE queries');

  // Check if architecture diagram exists
  const archDiagramPath = path.join(assetsDir, 'architecture-diagram.png');
  if (fs.existsSync(archDiagramPath)) {
    // Embed the full architecture diagram
    s.addImage({
      path: archDiagramPath,
      x: 0.5, y: 1.8, w: 12.3, h: 5.2
    });
    s.addText('See attached system design diagram showing all components and data flows', {
      x: 0.8, y: 7.0, w: 11.5, h: 0.4,
      fontFace: BODY, fontSize: 11, italic: true, color: MUTED,
      align: 'center', isTextBox: true, margin: 0
    });
  } else {
    // Fallback: Build architecture with boxes (original approach)
    console.log('️  architecture-diagram.png not found, using fallback boxes');
    console.log('   Save your diagram as ppt-assets/architecture-diagram.png for the full version');

    // Buyer box
    s.addShape(pres.ShapeType.roundRect, {
      x: 0.8, y: 2.0, w: 3.0, h: 4.0,
      fill: { color: 'FFF3E0' },
      line: { color: CORAL, width: 2 },
      rectRadius: 0.15
    });
    addLogoOrPlaceholder(s, path.join(assetsDir, 'nodejs.svg'), 1.8, 2.2, 0.8, '539E43', 'N');
    s.addText('BUYER\n(Load Tester)', {
      x: 0.8, y: 3.1, w: 3.0, h: 0.6,
      fontFace: HEAD, fontSize: 14, bold: true, color: CORAL,
      align: 'center', isTextBox: true, margin: 0
    });
    s.addText('• 2000 concurrent requests\n• 10% duplicate IDs\n• Paced & burst modes\n• Audit logging (NDJSON)\n• Invariant verification', {
      x: 1.0, y: 3.8, w: 2.6, h: 2.0,
      fontFace: BODY, fontSize: 10, color: '333333',
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
    });

    // Arrow
    s.addShape(pres.ShapeType.rightArrow, { x: 4.2, y: 3.5, w: 1.5, h: 0.5, fill: { color: NAVY } });
    s.addText('HTTP\nPOST /buy', {
      x: 4.2, y: 2.8, w: 1.5, h: 0.6,
      fontFace: BODY, fontSize: 9, color: NAVY,
      align: 'center', isTextBox: true, margin: 0
    });

    // Seller box
    s.addShape(pres.ShapeType.roundRect, {
      x: 6.0, y: 2.0, w: 3.0, h: 4.0,
      fill: { color: 'E8F5E9' },
      line: { color: GREEN, width: 2 },
      rectRadius: 0.15
    });
    addLogoOrPlaceholder(s, path.join(assetsDir, 'fastify.svg'), 7.0, 2.2, 0.8, '000000', 'F');
    s.addText('SELLER\n(Node.js + Fastify)', {
      x: 6.0, y: 3.1, w: 3.0, h: 0.6,
      fontFace: HEAD, fontSize: 14, bold: true, color: GREEN,
      align: 'center', isTextBox: true, margin: 0
    });
    s.addText('• POST /reset\n• POST /buy (CTE)\n• GET /status\n• Connection pooling\n• Error recovery', {
      x: 6.2, y: 3.8, w: 2.6, h: 2.0,
      fontFace: BODY, fontSize: 10, color: '333333',
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
    });

    // Arrow
    s.addShape(pres.ShapeType.rightArrow, { x: 9.4, y: 3.5, w: 1.2, h: 0.5, fill: { color: '336791' } });
    s.addText('SQL\nCTE Query', {
      x: 9.4, y: 2.8, w: 1.2, h: 0.6,
      fontFace: BODY, fontSize: 9, color: '336791',
      align: 'center', isTextBox: true, margin: 0
    });

    // DB box (inside Docker container)
    s.addShape(pres.ShapeType.roundRect, {
      x: 10.6, y: 1.8, w: 2.4, h: 4.4,
      fill: { color: 'E3F2FD' },
      line: { color: '2496ED', width: 2, dashType: 'dash' },
      rectRadius: 0.15
    });
    s.addText('Docker Container', {
      x: 10.7, y: 1.9, w: 2.2, h: 0.3,
      fontFace: HEAD, fontSize: 9, bold: true, color: '2496ED',
      align: 'center', isTextBox: true, margin: 0
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: 10.8, y: 2.3, w: 2.0, h: 3.6,
      fill: { color: WHITE },
      line: { color: '336791', width: 1.5 },
      rectRadius: 0.1
    });
    addLogoOrPlaceholder(s, path.join(assetsDir, 'postgresql.svg'), 11.3, 2.5, 0.8, '336791', 'P');
    s.addText('POSTGRES', {
      x: 10.8, y: 3.4, w: 2.0, h: 0.4,
      fontFace: HEAD, fontSize: 13, bold: true, color: '336791',
      align: 'center', isTextBox: true, margin: 0
    });
    s.addText('• sales table\n• tickets table\n• Row locks\n• Unique indexes', {
      x: 10.9, y: 3.9, w: 1.8, h: 1.8,
      fontFace: BODY, fontSize: 10, color: '333333',
      isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
    });
  }

  // ============================================================================
  // SLIDE 9: DATABASE SCHEMA
  // ============================================================================
  console.log('📄 Slide 9: Database Schema');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Database Schema Design', NAVY);
  // Sales table
  s.addShape(pres.ShapeType.roundRect, {
    x: 1.0, y: 2.0, w: 5.0, h: 3.5,
    fill: { color: WHITE },
    shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 },
    rectRadius: 0.1
  });
  s.addShape(pres.ShapeType.rect, { x: 1.0, y: 2.0, w: 5.0, h: 0.5, fill: { color: NAVY }, rectRadius: 0 });
  s.addText('sales', {
    x: 1.0, y: 2.0, w: 5.0, h: 0.5,
    fontFace: HEAD, fontSize: 14, bold: true, color: WHITE,
    align: 'center', valign: 'middle', isTextBox: true, margin: 0
  });
  s.addText('sale_id (UUID, PK)\nticket_count (INT)\nis_active (BOOLEAN)\n\nUNIQUE INDEX on is_active\nWHERE is_active = true', {
    x: 1.3, y: 2.7, w: 4.4, h: 2.5,
    fontFace: 'Courier New', fontSize: 11, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
  });
  // Tickets table
  s.addShape(pres.ShapeType.roundRect, {
    x: 7.0, y: 2.0, w: 5.5, h: 3.5,
    fill: { color: WHITE },
    shadow: { type: 'outer', blur: 4, offset: 2, color: '000000', opacity: 0.08 },
    rectRadius: 0.1
  });
  s.addShape(pres.ShapeType.rect, { x: 7.0, y: 2.0, w: 5.5, h: 0.5, fill: { color: '336791' }, rectRadius: 0 });
  s.addText('tickets', {
    x: 7.0, y: 2.0, w: 5.5, h: 0.5,
    fontFace: HEAD, fontSize: 14, bold: true, color: WHITE,
    align: 'center', valign: 'middle', isTextBox: true, margin: 0
  });
  s.addText('sale_id (UUID, FK)\nticket_number (INT)\nuser_id (TEXT)\nrequest_id (TEXT)\n\nPK: (sale_id, ticket_number)\nUNIQUE: (sale_id, request_id)\n  WHERE request_id IS NOT NULL', {
    x: 7.3, y: 2.7, w: 4.9, h: 2.5,
    fontFace: 'Courier New', fontSize: 11, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  // Arrow between
  s.addShape(pres.ShapeType.rightArrow, { x: 6.1, y: 3.5, w: 0.8, h: 0.3, fill: { color: MUTED } });

  // ============================================================================
  // SLIDE 10: NAIVE APPROACH
  // ============================================================================
  console.log(' Slide 10: Naive Approach');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Phase 1: The Naive Approach', NAVY);
  addSubtitle(s, 'Proving the problem exists by building a broken system first');
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.9, w: 5.5, h: 2.5,
    fill: { color: 'FFF5F5' },
    line: { color: CORAL, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('Naive Logic (BROKEN)', {
    x: 1.0, y: 2.0, w: 5.0, h: 0.4,
    fontFace: HEAD, fontSize: 14, bold: true, color: CORAL,
    isTextBox: true, margin: 0
  });
  s.addText('if (ticketsAvailable > 0) {\n  ticket = getNextTicket();\n  ticketsAvailable--;\n  save(ticket);\n}', {
    x: 1.0, y: 2.5, w: 5.0, h: 1.5,
    fontFace: 'Courier New', fontSize: 12, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
  });
  addStatBox(s, 7.0, 1.9, 2.5, 1.2, '155', 'Tickets Sold (max 100)', CORAL);
  addStatBox(s, 9.8, 1.9, 2.5, 1.2, '5', 'Unique Ticket Numbers', CORAL);
  addStatBox(s, 7.0, 3.4, 2.5, 1.2, '152', 'Lost Confirmed Sales', CORAL);
  addStatBox(s, 9.8, 3.4, 2.5, 1.2, 'FAIL', 'All 4 Invariants', CORAL);
  s.addText('Result: 155 tickets sold for 100 inventory. Only 5 unique numbers issued. Massive data corruption.', {
    x: 0.8, y: 5.0, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 13, bold: true, color: CORAL,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 11: RACE CONDITION EXPLAINED
  // ============================================================================
  console.log('📄 Slide 11: Race Condition');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'The Race Condition Explained', WHITE);
  s.addText('Two users buy the last ticket at the exact same millisecond:', {
    x: 0.8, y: 1.3, w: 11, h: 0.5,
    fontFace: BODY, fontSize: 16, color: GOLD,
    isTextBox: true, margin: 0
  });
  const steps = [
    ['T=0ms', 'Alice checks: available = 1 ✓', 'Bob checks: available = 1 ✓'],
    ['T=1ms', 'Alice claims Ticket #100', 'Bob claims Ticket #100'],
    ['T=2ms', 'Alice saves → Ticket #100', 'Bob saves → Ticket #100'],
    ['T=3ms', 'Both think they won!', 'TICKET SOLD TWICE!'],
  ];
  steps.forEach((step, i) => {
    const y = 2.2 + i * 1.0;
    s.addText(step[0], { x: 0.8, y, w: 1.2, h: 0.5, fontFace: HEAD, fontSize: 14, bold: true, color: GOLD, isTextBox: true, margin: 0 });
    s.addShape(pres.ShapeType.roundRect, { x: 2.2, y, w: 4.5, h: 0.6, fill: { color: '1A2744' }, rectRadius: 0.08 });
    s.addText(step[1], { x: 2.4, y, w: 4.1, h: 0.6, fontFace: BODY, fontSize: 12, color: i === 3 ? CORAL : WHITE, valign: 'middle', isTextBox: true, margin: 0 });
    s.addShape(pres.ShapeType.roundRect, { x: 7.2, y, w: 4.5, h: 0.6, fill: { color: '1A2744' }, rectRadius: 0.08 });
    s.addText(step[2], { x: 7.4, y, w: 4.1, h: 0.6, fontFace: BODY, fontSize: 12, color: i === 3 ? CORAL : WHITE, valign: 'middle', isTextBox: true, margin: 0 });
  });

  // ============================================================================
  // SLIDE 12: THE FIX
  // ============================================================================
  console.log('📄 Slide 12: The Fix');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Phase 2: The Fix — FOR UPDATE SKIP LOCKED', NAVY);
  addSubtitle(s, 'PostgreSQL row-level locking prevents race conditions at the database level');
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.9, w: 7.0, h: 3.0,
    fill: { color: 'F0FFF0' },
    line: { color: GREEN, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('Fixed SQL Query', {
    x: 1.0, y: 2.0, w: 6.5, h: 0.4,
    fontFace: HEAD, fontSize: 14, bold: true, color: GREEN,
    isTextBox: true, margin: 0
  });
  s.addText('UPDATE tickets\nSET user_id = $1, request_id = $2\nWHERE ticket_number = (\n  SELECT ticket_number FROM tickets\n  WHERE sale_id = $3\n    AND user_id IS NULL\n  ORDER BY ticket_number\n  LIMIT 1\n  FOR UPDATE SKIP LOCKED\n)\nRETURNING ticket_number', {
    x: 1.0, y: 2.5, w: 6.5, h: 2.2,
    fontFace: 'Courier New', fontSize: 10, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  addCard(s, 8.2, 1.9, 4.2, 3.0, 'How It Works', 'FOR UPDATE: Locks the row so no other transaction can modify it.\n\nSKIP LOCKED: Skips rows already locked by other transactions instead of waiting.\n\nResult: Each concurrent request safely claims a DIFFERENT ticket.', GREEN);
  addStatBox(s, 0.8, 5.3, 2.8, 1.2, '100', 'Tickets Sold (exact)', GREEN);
  addStatBox(s, 3.9, 5.3, 2.8, 1.2, '100', 'Unique Numbers', GREEN);
  addStatBox(s, 7.0, 5.3, 2.8, 1.2, '0', 'Lost Sales', GREEN);
  addStatBox(s, 10.1, 5.3, 2.4, 1.2, 'PASS', 'All Invariants', GREEN);

  // ============================================================================
  // SLIDE 13: CTE OPTIMIZATION
  // ============================================================================
  console.log('📄 Slide 13: CTE Optimization');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Phase 3: CTE Optimization (Single-Trip Query)', NAVY);
  addSubtitle(s, 'Reducing 3 database round trips to 1 atomic query');
  s.addShape(pres.ShapeType.roundRect, { x: 0.8, y: 1.9, w: 3.6, h: 1.5, fill: { color: 'FFF5F5' }, rectRadius: 0.1 });
  s.addText('BEFORE: 3 Round Trips', { x: 1.0, y: 2.0, w: 3.2, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: CORAL, isTextBox: true, margin: 0 });
  s.addText('1. SELECT (idempotency)\n2. UPDATE (claim)\n3. SELECT (sold out check)', { x: 1.0, y: 2.4, w: 3.2, h: 0.9, fontFace: BODY, fontSize: 10, color: '333333', isTextBox: true, margin: 0, lineSpacingMultiple: 1.2 });
  s.addShape(pres.ShapeType.rightArrow, { x: 4.8, y: 2.3, w: 1.0, h: 0.4, fill: { color: NAVY } });
  s.addShape(pres.ShapeType.roundRect, { x: 6.2, y: 1.9, w: 3.6, h: 1.5, fill: { color: 'F0FFF0' }, rectRadius: 0.1 });
  s.addText('AFTER: 1 CTE Query', { x: 6.4, y: 2.0, w: 3.2, h: 0.3, fontFace: HEAD, fontSize: 12, bold: true, color: GREEN, isTextBox: true, margin: 0 });
  s.addText('WITH existing AS (...)\n     free AS (...)\n     claimed AS (...)\nSELECT ... UNION ALL ...', { x: 6.4, y: 2.4, w: 3.2, h: 0.9, fontFace: 'Courier New', fontSize: 9, color: '333333', isTextBox: true, margin: 0, lineSpacingMultiple: 1.2 });
  addStatBox(s, 0.8, 4.0, 3.6, 1.2, '66%', 'Fewer DB Round Trips', GREEN);
  addStatBox(s, 4.8, 4.0, 3.6, 1.2, '~20%', 'Latency Reduction', GREEN);
  addStatBox(s, 8.8, 4.0, 3.6, 1.2, '1', 'Atomic SQL Statement', NAVY);

  // ============================================================================
  // SLIDE 14: RAMP TEST (OPTIMIZED NUMBERS)
  // ============================================================================
  console.log('📄 Slide 14: Ramp Test');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Phase 4: Ramp Test — Finding the Bottleneck', NAVY);
  addSubtitle(s, 'Measuring how latency scales with increasing concurrency (OPTIMIZED)');
  // Table header
  s.addShape(pres.ShapeType.rect, { x: 1.5, y: 2.0, w: 10, h: 0.5, fill: { color: NAVY } });
  s.addText('Concurrency', { x: 1.5, y: 2.0, w: 2.5, h: 0.5, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  s.addText('Median Latency', { x: 4.0, y: 2.0, w: 2.5, h: 0.5, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  s.addText('P99 Latency', { x: 6.5, y: 2.0, w: 2.5, h: 0.5, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  s.addText('Invariants', { x: 9.0, y: 2.0, w: 2.5, h: 0.5, fontFace: HEAD, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  // Table rows - OPTIMIZED NUMBERS
  const rampData = [
    ['100', '84.8 ms', '304.7 ms', 'ALL PASS'],
    ['500', '512.6 ms', '1155.9 ms', 'ALL PASS'],
    ['1000', '895.8 ms', '2014.9 ms', 'ALL PASS'],
  ];
  rampData.forEach((row, i) => {
    const y = 2.5 + i * 0.6;
    const bg = i % 2 === 0 ? LIGHT : WHITE;
    s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 10, h: 0.6, fill: { color: bg } });
    s.addText(row[0], { x: 1.5, y, w: 2.5, h: 0.6, fontFace: BODY, fontSize: 13, bold: true, color: NAVY, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(row[1], { x: 4.0, y, w: 2.5, h: 0.6, fontFace: BODY, fontSize: 13, color: '333333', align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(row[2], { x: 6.5, y, w: 2.5, h: 0.6, fontFace: BODY, fontSize: 13, bold: true, color: i === 0 ? GREEN : CORAL, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(row[3], { x: 9.0, y, w: 2.5, h: 0.6, fontFace: BODY, fontSize: 13, bold: true, color: GREEN, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  });
  s.addText('Conclusion: P99 latency scales with concurrency due to DB lock contention — not Node.js. Correctness is preserved at every level.', {
    x: 0.8, y: 4.8, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 13, bold: true, color: NAVY,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 15: DB SLOWDOWN
  // ============================================================================
  console.log('📄 Slide 15: DB Slowdown');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'Phase 5: 10-Second Database Slowdown', WHITE);
  addSubtitle(s, 'What happens when the database becomes extremely slow mid-sale?', 'AAB8D0');
  s.addText('Test Setup:', { x: 0.8, y: 1.8, w: 5, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: GOLD, isTextBox: true, margin: 0 });
  s.addText('1. Start paced buyer (30 seconds, 2000 requests)\n2. At T=5s, lock the database for 10 seconds\n3. Observe: Does the system stay correct?', {
    x: 0.8, y: 2.3, w: 5.5, h: 1.2,
    fontFace: BODY, fontSize: 12, color: 'AAB8D0',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
  });
  addStatBox(s, 7.0, 1.8, 2.5, 1.2, '10s', 'DB Locked Duration', CORAL);
  addStatBox(s, 9.8, 1.8, 2.5, 1.2, '>10s', 'P99 Latency Spike', CORAL);
  addStatBox(s, 7.0, 3.3, 2.5, 1.2, '1000', 'Tickets Sold (exact)', GREEN);
  addStatBox(s, 9.8, 3.3, 2.5, 1.2, 'PASS', 'All Invariants', GREEN);
  s.addText('Key Finding: Latency spiked massively, but correctness was NEVER compromised. The system degraded gracefully.', {
    x: 0.8, y: 5.2, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 13, bold: true, color: GOLD,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 16: DB KILL TEST
  // ============================================================================
  console.log('📄 Slide 16: DB Kill Test');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Phase 6: Database Kill Test (Extreme Resilience)', NAVY);
  addSubtitle(s, 'Simulating a complete database crash mid-sale using docker kill');
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 1.9, w: 5.5, h: 3.5,
    fill: { color: 'FFF5F5' },
    line: { color: CORAL, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('What Happened', {
    x: 1.0, y: 2.0, w: 5.0, h: 0.4,
    fontFace: HEAD, fontSize: 14, bold: true, color: CORAL,
    isTextBox: true, margin: 0
  });
  s.addText('T=0s:  Buyer starts firing 2000 requests\nT=5s:  docker kill ticket-postgres-1\n       Database dies instantly\n       Seller logs 100+ connection errors\n       Server does NOT crash\nT=10s: docker start ticket-postgres-1\n       Database comes back online\nT=10-30s: Buyer retries recover requests\nT=30s:  Test completes successfully', {
    x: 1.0, y: 2.5, w: 5.0, h: 2.8,
    fontFace: 'Courier New', fontSize: 9, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  addCard(s, 6.8, 1.9, 5.5, 3.5, 'The Fix That Saved Us', '1. client.on("error") handlers prevent Node.js process crashes when checked-out connections drop.\n\n2. client.release() in finally blocks prevent connection pool exhaustion.\n\n3. CREATE TABLE IF NOT EXISTS prevents data wipe on server restart.\n\n4. Buyer retry logic recovers in-flight requests automatically.', GREEN);

  // ============================================================================
  // SLIDE 17: AUTOPSY TOOL
  // ============================================================================
  console.log('📄 Slide 17: Autopsy Tool');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Phase 7: Automated Autopsy Tool', NAVY);
  addSubtitle(s, 'Forensic analysis of 13,000+ request attempts after a database crash');
  addCard(s, 0.8, 1.9, 5.5, 2.5, 'What the Autopsy Does', '1. Reads NDJSON audit log (every request attempt)\n2. Groups by request_id, sorts by timestamp\n3. Detects incident windows (elevated error rates)\n4. Classifies requests into recovery categories\n5. Cross-checks against final /status snapshot\n6. Generates markdown incident report', NAVY);
  addCard(s, 6.8, 1.9, 5.5, 2.5, 'Key Findings from DB Kill', 'Incident Window: 21.023 seconds\nConfirmed First Try: 878 requests\nConfirmed After Retry: 121 requests\nIn-Doubt Resolved: 1 request\nIn-Doubt Unresolved: 132 requests\nLost Sales: 0\nRecovery Duration: 0.137 seconds', GREEN);
  s.addText('The autopsy tool provides MATHEMATICAL PROOF that the system recovered correctly — not just "it looks fine."', {
    x: 0.8, y: 5.0, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 13, bold: true, color: NAVY,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 18: AUTOPSY VERDICT
  // ============================================================================
  console.log('📄 Slide 18: Autopsy Verdict');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'Autopsy Report: Final Verdict', WHITE);
  const verdicts = [
    ['INV 1', 'Never Oversell', 'PASS — sold 1000 of 1000', GREEN],
    ['INV 2', 'No Duplicate Tickets', 'PASS — all unique', GREEN],
    ['INV 3', 'Idempotency', 'PASS — 121 retries, 0 mismatches', GREEN],
    ['INV 4', 'No Lost Sales', 'PASS — 0 lost confirmed sales', GREEN],
  ];
  verdicts.forEach((v, i) => {
    const y = 1.8 + i * 1.2;
    s.addShape(pres.ShapeType.roundRect, { x: 1.5, y, w: 10, h: 0.9, fill: { color: '1A2744' }, rectRadius: 0.1 });
    s.addShape(pres.ShapeType.rect, { x: 1.5, y, w: 0.08, h: 0.9, fill: { color: v[3] } });
    s.addText(v[0], { x: 1.8, y, w: 1.0, h: 0.9, fontFace: HEAD, fontSize: 14, bold: true, color: v[3], valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(v[1], { x: 3.0, y, w: 3.0, h: 0.9, fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(v[2], { x: 6.5, y, w: 4.5, h: 0.9, fontFace: BODY, fontSize: 13, color: v[3], valign: 'middle', isTextBox: true, margin: 0 });
  });
  s.addText('All 4 invariants verified across 13,244 request attempts during a live database crash.', {
    x: 0.8, y: 6.5, w: 11.5, h: 0.5,
    fontFace: BODY, fontSize: 14, italic: true, color: GOLD,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SLIDE 19: COMPONENT DIAGRAM
  // ============================================================================
  console.log('📄 Slide 19: Component Diagram');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Component Diagram', NAVY);
  // Docker container
  s.addShape(pres.ShapeType.roundRect, {
    x: 7.5, y: 1.8, w: 5.0, h: 5.0,
    fill: { color: 'E3F2FD' },
    line: { color: '2496ED', width: 2, dashType: 'dash' },
    rectRadius: 0.2
  });
  s.addText('Docker Container', {
    x: 7.7, y: 1.9, w: 3, h: 0.3,
    fontFace: HEAD, fontSize: 10, bold: true, color: '2496ED',
    isTextBox: true, margin: 0
  });
  // PostgreSQL
  s.addShape(pres.ShapeType.roundRect, {
    x: 8.2, y: 2.5, w: 3.5, h: 1.8,
    fill: { color: WHITE },
    line: { color: '336791', width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('PostgreSQL 16', {
    x: 8.2, y: 2.6, w: 3.5, h: 0.4,
    fontFace: HEAD, fontSize: 13, bold: true, color: '336791',
    align: 'center', isTextBox: true, margin: 0
  });
  s.addText('• sales table\n• tickets table\n• Row-level locks\n• Partial unique indexes', {
    x: 8.4, y: 3.1, w: 3.1, h: 1.0,
    fontFace: BODY, fontSize: 9, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  // Slow DB script
  s.addShape(pres.ShapeType.roundRect, {
    x: 8.2, y: 4.8, w: 3.5, h: 1.2,
    fill: { color: WHITE },
    line: { color: GOLD, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('slow-db.js', {
    x: 8.2, y: 4.9, w: 3.5, h: 0.3,
    fontFace: HEAD, fontSize: 11, bold: true, color: GOLD,
    align: 'center', isTextBox: true, margin: 0
  });
  s.addText('Simulates DB slowdown\nvia pg_sleep() + LOCK', {
    x: 8.4, y: 5.3, w: 3.1, h: 0.6,
    fontFace: BODY, fontSize: 9, color: '333333',
    isTextBox: true, margin: 0
  });
  // Seller
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 2.0, w: 3.0, h: 2.5,
    fill: { color: 'E8F5E9' },
    line: { color: GREEN, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('Seller (Fastify)', {
    x: 0.8, y: 2.1, w: 3.0, h: 0.4,
    fontFace: HEAD, fontSize: 13, bold: true, color: GREEN,
    align: 'center', isTextBox: true, margin: 0
  });
  s.addText('• /reset, /buy, /status\n• CTE optimization\n• Connection pooling\n• Error recovery', {
    x: 1.0, y: 2.6, w: 2.6, h: 1.5,
    fontFace: BODY, fontSize: 9, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  // Buyer
  s.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 5.0, w: 3.0, h: 1.8,
    fill: { color: 'FFF3E0' },
    line: { color: CORAL, width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('Buyer (Load Tester)', {
    x: 0.8, y: 5.1, w: 3.0, h: 0.4,
    fontFace: HEAD, fontSize: 13, bold: true, color: CORAL,
    align: 'center', isTextBox: true, margin: 0
  });
  s.addText('• 2000 concurrent reqs\n• Audit logging\n• Invariant checks', {
    x: 1.0, y: 5.5, w: 2.6, h: 1.0,
    fontFace: BODY, fontSize: 9, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  // Autopsy
  s.addShape(pres.ShapeType.roundRect, {
    x: 4.2, y: 5.0, w: 2.8, h: 1.8,
    fill: { color: 'F3E5F5' },
    line: { color: '7B1FA2', width: 1.5 },
    rectRadius: 0.1
  });
  s.addText('Autopsy Tool', {
    x: 4.2, y: 5.1, w: 2.8, h: 0.4,
    fontFace: HEAD, fontSize: 13, bold: true, color: '7B1FA2',
    align: 'center', isTextBox: true, margin: 0
  });
  s.addText('• Reads audit log\n• Detects incidents\n• Verifies invariants', {
    x: 4.4, y: 5.5, w: 2.4, h: 1.0,
    fontFace: BODY, fontSize: 9, color: '333333',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.2
  });
  // Arrows
  s.addShape(pres.ShapeType.rightArrow, { x: 4.0, y: 3.0, w: 3.8, h: 0.3, fill: { color: NAVY } });
  s.addShape(pres.ShapeType.rightArrow, { x: 4.0, y: 5.7, w: 0.1, h: 0.3, fill: { color: MUTED } });

  // ============================================================================
  // SLIDE 20: KEY METRICS
  // ============================================================================
  console.log('📄 Slide 20: Key Metrics');
  s = pres.addSlide();
  addBg(s, LIGHT);
  addTitle(s, 'Key Performance Metrics', NAVY);
  addStatBox(s, 0.8, 1.8, 2.8, 1.5, '1000', 'Tickets Sold\n(exact, no oversell)', GREEN);
  addStatBox(s, 3.9, 1.8, 2.8, 1.5, '0', 'Lost Sales\n(during DB crash)', GREEN);
  addStatBox(s, 7.0, 1.8, 2.8, 1.5, '121', 'Recovered Requests\n(after DB restart)', GOLD);
  addStatBox(s, 10.1, 1.8, 2.4, 1.5, '4/4', 'Invariants\nPassed', GREEN);
  addStatBox(s, 0.8, 3.8, 2.8, 1.5, '304ms', 'P99 at 100\nConcurrency', NAVY);
  addStatBox(s, 3.9, 3.8, 2.8, 1.5, '1155ms', 'P99 at 500\nConcurrency', CORAL);
  addStatBox(s, 7.0, 3.8, 2.8, 1.5, '2014ms', 'P99 at 1000\nConcurrency', CORAL);
  addStatBox(s, 10.1, 3.8, 2.4, 1.5, '13K+', 'Total Request\nAttempts Analyzed', NAVY);

  // ============================================================================
  // SLIDE 21: LESSONS LEARNED
  // ============================================================================
  console.log('📄 Slide 21: Lessons Learned');
  s = pres.addSlide();
  addBg(s, WHITE);
  addTitle(s, 'Lessons Learned', NAVY);
  addCard(s, 0.8, 1.8, 5.5, 2.0, 'Correctness > Speed', 'A fast system that oversells is worthless. Always enforce invariants at the database level, not the application level. Application-level checks can be bypassed by concurrency.', CORAL);
  addCard(s, 6.8, 1.8, 5.5, 2.0, 'Observe Everything', 'Without audit logging and the autopsy tool, we would have no proof that the system recovered. Observability is not optional — it is how you prove correctness.', NAVY);
  addCard(s, 0.8, 4.2, 5.5, 2.0, 'Fail Gracefully', 'The server must NOT crash when the database dies. client.on("error") handlers and proper connection release are the difference between a 5-second outage and a 5-hour outage.', GOLD);
  addCard(s, 6.8, 4.2, 5.5, 2.0, 'Test the Worst Case', 'Don\'t just test the happy path. Kill the database, lock the tables, send duplicate requests. The bugs that matter are the ones that happen at 2 AM on a Sunday.', GREEN);

  // ============================================================================
  // SLIDE 22: TRADE-OFFS
  // ============================================================================
  console.log('📄 Slide 22: Trade-Offs');
  s = pres.addSlide();
  addBg(s, DARK);
  addTitle(s, 'Honest Trade-Offs', WHITE);
  s.addText('Every engineering decision has a cost. Here are ours:', {
    x: 0.8, y: 1.3, w: 11, h: 0.5,
    fontFace: BODY, fontSize: 16, color: GOLD,
    isTextBox: true, margin: 0
  });
  const tradeoffs = [
    ['Audit Logging Overhead', '+800ms median latency', 'Accepted for forensic traceability'],
    ['Row-Level Locking', 'P99 spikes to 2s at 1000 concurrency', 'Accepted for strict correctness'],
    ['Single-Server Design', 'No horizontal scaling yet', 'Deprioritized for DB-kill deep-dive'],
    ['Autopsy Recovery Duration', 'Known limitation under retry tails', 'Verified via confirmed_after_retry count'],
  ];
  tradeoffs.forEach((t, i) => {
    const y = 2.0 + i * 1.1;
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y, w: 11.5, h: 0.9, fill: { color: '1A2744' }, rectRadius: 0.1 });
    s.addText(t[0], { x: 1.0, y, w: 3.5, h: 0.9, fontFace: HEAD, fontSize: 13, bold: true, color: WHITE, valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(t[1], { x: 4.5, y, w: 3.5, h: 0.9, fontFace: BODY, fontSize: 12, color: CORAL, valign: 'middle', isTextBox: true, margin: 0 });
    s.addText(t[2], { x: 8.0, y, w: 4.0, h: 0.9, fontFace: BODY, fontSize: 11, color: 'AAB8D0', valign: 'middle', isTextBox: true, margin: 0 });
  });

  // ============================================================================
  // SLIDE 23: CONCLUSION
  // ============================================================================
  console.log('📄 Slide 23: Conclusion');
  s = pres.addSlide();
  addBg(s, DARK);
  s.addShape(pres.ShapeType.rect, { x: 0, y: 3.0, w: 13.3, h: 0.06, fill: { color: GOLD } });
  s.addText('TICKET STAMPEDE', {
    x: 0.8, y: 1.0, w: 11.5, h: 1.0,
    fontFace: HEAD, fontSize: 48, bold: true, color: WHITE,
    isTextBox: true, margin: 0
  });
  s.addText('From Naive Overselling to Production-Grade Resilience', {
    x: 0.8, y: 2.2, w: 11.5, h: 0.6,
    fontFace: BODY, fontSize: 20, color: GOLD,
    isTextBox: true, margin: 0
  });
  s.addText('Built a fault-tolerant ticketing system that survives database crashes, handles 1000+ concurrent requests, and provides mathematical proof of correctness through automated forensic analysis.', {
    x: 0.8, y: 3.5, w: 10, h: 1.0,
    fontFace: BODY, fontSize: 14, color: 'AAB8D0',
    isTextBox: true, margin: 0, lineSpacingMultiple: 1.3
  });
  s.addText('Node.js  |  Fastify  |  PostgreSQL  |  Docker', {
    x: 0.8, y: 5.5, w: 11.5, h: 0.5,
    fontFace: BODY, fontSize: 14, color: MUTED,
    isTextBox: true, margin: 0
  });
  s.addText('Thank You!', {
    x: 0.8, y: 6.2, w: 11.5, h: 0.6,
    fontFace: HEAD, fontSize: 24, bold: true, color: WHITE,
    isTextBox: true, margin: 0
  });

  // ============================================================================
  // SAVE PRESENTATION
  // ============================================================================
  const outputPath = path.join(__dirname, 'Ticket_Stampede_Presentation.pptx');
  console.log('\n💾 Saving presentation...');
  await pres.writeFile({ fileName: outputPath });
  console.log(`✅ Presentation saved to: ${outputPath}`);
  console.log('\n🎉 Done! Open the PPT file in PowerPoint to view your presentation.');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});