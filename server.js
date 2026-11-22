const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = '2026';
const dataFile = path.join(__dirname, 'data.json');

// ===== 예상 참석자 명단 =====
const EXPECTED = [
  { company: "(주)아모레퍼시픽", dept: "IR팀", name: "김은빈", empId: "AP55004992" },
  { company: "(주)아모레퍼시픽", dept: "라네즈 BPI1팀", name: "이준형", empId: "AP55004993" },
  { company: "(주)아모레퍼시픽", dept: "글로벌 사업개발3팀", name: "서소정", empId: "AP55004997" },
  { company: "(주)아모레퍼시픽", dept: "브랜드 크리에이티브1팀", name: "최보경", empId: "AP55005041" },
  { company: "(주)아모레퍼시픽", dept: "브랜드 크리에이티브1팀", name: "최경은", empId: "AP55005042" },
  { company: "(주)아모레퍼시픽", dept: "한율팀", name: "이보미", empId: "AP55005040" },
  { company: "(주)아모레퍼시픽", dept: "더마뷰티 MC팀", name: "이유미", empId: "AP55005109" },
  { company: "(주)아모레퍼시픽", dept: "글로벌 사업개발2팀", name: "민영은", empId: "AP55005111" },
  { company: "(주)아모레퍼시픽", dept: "헤어앤뷰티 글로벌커머셜1팀", name: "김해솔", empId: "AP55005110" },
  { company: "(주)에뛰드", dept: "에뛰드 브랜드운영팀", name: "김재원", empId: "EP55005119" },
  { company: "(주)아모레퍼시픽", dept: "DSP 3팀", name: "강다영", empId: "AP55005159" },
  { company: "(주)아모레퍼시픽", dept: "라네즈 글로벌커머셜1팀", name: "이지선", empId: "AP55005160" },
  { company: "(주)이니스프리", dept: "이니스프리 글로벌커머셜2팀", name: "윤지은", empId: "NP55005145" },
  { company: "(주)아모레퍼시픽", dept: "Open Development팀", name: "박나정", empId: "AP55005210" },
  { company: "(주)아모레퍼시픽", dept: "노사협력팀", name: "김민수", empId: "AP55005213" },
  { company: "(주)아모레퍼시픽", dept: "더마뷰티 MC팀", name: "이주경", empId: "AP55005212" },
  { company: "(주)아모레퍼시픽", dept: "라네즈 글로벌커머셜2팀", name: "이슬아", empId: "AP55005242" },
  { company: "(주)아모레퍼시픽", dept: "설화수 BD팀", name: "김유미", empId: "AP55005241" },
  { company: "(주)아모레퍼시픽", dept: "프리시전마케팅팀", name: "황진주", empId: "AP55005239" },
  { company: "(주)아모레퍼시픽", dept: "헤라 BM팀", name: "박예원", empId: "AP55005240" },
  { company: "(주)에스쁘아", dept: "에스쁘아 소셜커머스 TF", name: "이민선", empId: "SP55005231" },
  { company: "(주)에스쁘아", dept: "에스쁘아 소셜커머스 TF", name: "김진하", empId: "SP55005232" },
  { company: "(주)아모레퍼시픽", dept: "더마뷰티 MC팀", name: "손제시카", empId: "AP55005211" },
  { company: "(주)아모레퍼시픽", dept: "헤어앤뷰티 MC팀", name: "신효림", empId: "AP55005294" },
  { company: "(주)아모레퍼시픽", dept: "라네즈 RM팀", name: "이선아", empId: "AP55005331" },
  { company: "(주)아모레퍼시픽", dept: "리테일 MBS 영업1팀", name: "김현수", empId: "AP55005333" },
  { company: "(주)아모레퍼시픽", dept: "바이탈뷰티 BM팀", name: "임이슬", empId: "AP55005329" },
  { company: "(주)아모레퍼시픽", dept: "바이탈뷰티 글로벌 TF", name: "시마모리사유키", empId: "AP55005330" },
  { company: "(주)아모레퍼시픽", dept: "헤어앤뷰티 한국사업팀", name: "윤재연", empId: "AP55005332" },
  { company: "(주)이니스프리", dept: "이니스프리 BA팀", name: "박혜림", empId: "NP55005316" },
  { company: "(주)아모레퍼시픽", dept: "바이탈뷰티 GTM팀", name: "윤혜정", empId: "AP55005418" },
  { company: "(주)아모레퍼시픽", dept: "바이탈뷰티 GTM팀", name: "류향은", empId: "AP55005419" },
  { company: "(주)이니스프리", dept: "이니스프리 BD팀", name: "우진영", empId: "NP55005381" },
  { company: "(주)아모레퍼시픽", dept: "프리시전마케팅팀", name: "허지은", empId: "AP55005651" },
  { company: "(주)아모레퍼시픽", dept: "인사팀", name: "도준", empId: "AP55005690" },
  { company: "(주)아모레퍼시픽", dept: "인재관리팀", name: "김윤희", empId: "AP55005877" }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return { attendees: [], nextId: 1, session: { title: "사내 교육 출석", is_open: false } };
  }
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function kstTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
}

function normalize(s) {
  return (s || "").replace(/\s+/g, "").toLowerCase();
}

function findExpected(name) {
  const nName = normalize(name);
  return EXPECTED.find(e => normalize(e.name) === nName);
}

app.post('/api/register', (req, res) => {
  const { team, name } = req.body;
  if (!team?.trim() || !name?.trim()) {
    return res.status(400).json({ error: '소속 팀과 이름을 모두 입력해 주세요.' });
  }
  const data = readData();
  if (!data.session?.is_open) {
    return res.status(403).json({ error: '현재 출석이 진행 중이 아닙니다.' });
  }

  const expected = findExpected(name);
  const key = expected ? expected.empId : `name:${normalize(name)}`;

  const already = data.attendees.find(a => a.key === key);
  if (already) {
    already.duplicate_attempts = (already.duplicate_attempts || 0) + 1;
    writeData(data);
    return res.status(409).json({ error: '이미 출석한 분입니다.' });
  }

  const now = new Date().toISOString();
  data.attendees.push({
    id: data.nextId++,
    key,
    team: team.trim(),
    name: name.trim(),
    empId: expected?.empId || null,
    company: expected?.company || null,
    dept: expected?.dept || team.trim(),
    attended_at: now,
    matched: !!expected,
    duplicate_attempts: 0
  });
  writeData(data);

  res.json({
    success: true,
    time: kstTime(now),
    matched: !!expected,
    message: expected ? "출석이 완료되었습니다." : "출석 등록되었습니다. (명단에 없는 이름)"
  });
});

app.get('/api/status', (req, res) => {
  const data = readData();
  const attendedNames = new Set(
    data.attendees
      .filter(a => a.matched)
      .map(a => normalize(a.name))
  );

  const present = data.attendees.slice().reverse();
  const absent = EXPECTED.filter(e => !attendedNames.has(normalize(e.name)));

  const matchedCount = present.filter(p => p.matched).length;

  res.json({
    session: data.session || { title: "사내 교육 출석", is_open: false },
    expectedTotal: EXPECTED.length,
    presentCount: present.length,
    matchedCount,
    absentCount: absent.length,
    present,
    absent,
    rate: EXPECTED.length ? Math.round((matchedCount / EXPECTED.length) * 100) : 0
  });
});

app.post('/api/session', (req, res) => {
  const { pin, action, title } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'PIN이 올바르지 않습니다.' });
  const data = readData();
  if (!data.session) data.session = {};
  if (action === 'start') {
    data.session.is_open = true;
    data.session.title = title || data.session.title || "사내 교육 출석";
    data.session.started_at = new Date().toISOString();
  } else if (action === 'end') {
    data.session.is_open = false;
    data.session.ended_at = new Date().toISOString();
  } else if (action === 'save') {
    data.session.title = title;
  }
  writeData(data);
  res.json({ success: true });
});

app.post('/api/manual', (req, res) => {
  const { pin, empId, action } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: '권한 없음' });
  const data = readData();
  const person = EXPECTED.find(e => e.empId === empId);
  if (!person) return res.status(404).json({ error: '명단에 없습니다' });

  if (action === 'checkin') {
    if (data.attendees.some(a => a.key === empId)) return res.json({ success: true });
    data.attendees.push({
      id: data.nextId++,
      key: empId,
      team: person.dept,
      name: person.name,
      empId: person.empId,
      company: person.company,
      dept: person.dept,
      attended_at: new Date().toISOString(),
      matched: true,
      manual: true,
      duplicate_attempts: 0
    });
  } else if (action === 'cancel') {
    data.attendees = data.attendees.filter(a => a.key !== empId && normalize(a.name) !== normalize(person.name));
  }
  writeData(data);
  res.json({ success: true });
});

app.get('/api/export', (req, res) => {
  const pin = req.query.pin;
  if (pin !== ADMIN_PIN) return res.status(401).send('권한 없음');
  const data = readData();
  let csv = '이름,입력한 팀,명단 부서,사번,출석 시간,매칭여부\n';
  data.attendees.forEach(a => {
    csv += `"${a.name}","${a.team}","${a.dept || ''}","${a.empId || ''}","${kstTime(a.attended_at)}","${a.matched ? 'Y' : 'N'}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send('\uFEFF' + csv);
});

app.get('/api/qr', async (req, res) => {
  const host = req.get('host');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = `${proto}://${host}/attend`;
  try {
    const qr = await QRCode.toDataURL(url, { width: 600, margin: 2 });
    res.json({ url, qr });
  } catch {
    res.status(500).json({ error: 'QR 생성 실패' });
  }
});

app.get('/', (req, res) => res.redirect('/admin'));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/attend', (req, res) => res.sendFile(path.join(__dirname, 'public', 'attend.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`서버 실행: 포트 ${PORT}`);
});
