const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;
const ADMIN_PIN = '2026';
const dataFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return {
      session: { title: '사내 교육 출석', expected_count: 0, is_open: false, started_at: null, ended_at: null },
      attendees: [],
      nextId: 1
    };
  }
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function kstTime(iso) {
  return new Date(iso).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
}

// 출석 등록
app.post('/api/register', (req, res) => {
  const { team, name } = req.body;
  if (!team?.trim() || !name?.trim()) {
    return res.status(400).json({ error: '소속 팀과 이름을 모두 입력해 주세요.' });
  }
  const data = readData();
  if (!data.session.is_open) {
    return res.status(403).json({ error: '현재 출석이 진행 중이 아닙니다.' });
  }
  const existing = data.attendees.find(a => a.team === team.trim() && a.name === name.trim());
  if (existing) {
    existing.duplicate_attempts = (existing.duplicate_attempts || 0) + 1;
    writeData(data);
    return res.status(409).json({ error: '이미 출석한 팀원입니다 (중복 등록 불가)' });
  }
  const now = new Date().toISOString();
  data.attendees.push({
    id: data.nextId++,
    team: team.trim(),
    name: name.trim(),
    attended_at: now,
    duplicate_attempts: 0
  });
  writeData(data);
  res.json({ success: true, time: kstTime(now) });
});

// 관리자 API
app.get('/api/status', (req, res) => {
  const data = readData();
  const present = data.attendees.length;
  const expected = data.session.expected_count || 0;
  res.json({
    session: data.session,
    attendees: data.attendees.slice().reverse(),
    stats: {
      expected,
      present,
      absent: Math.max(0, expected - present),
      rate: expected > 0 ? Math.round((present / expected) * 100) : 0
    }
  });
});

app.post('/api/session', (req, res) => {
  const { pin, action, title, expected } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: 'PIN이 올바르지 않습니다.' });
  const data = readData();
  const now = new Date().toISOString();
  if (action === 'start') {
    data.session = { title: title || '사내 교육 출석', expected_count: Number(expected) || 0, is_open: true, started_at: now, ended_at: null };
  } else if (action === 'end') {
    data.session.is_open = false;
    data.session.ended_at = now;
  } else if (action === 'save') {
    data.session.title = title;
    data.session.expected_count = Number(expected) || 0;
  }
  writeData(data);
  res.json({ success: true });
});

app.delete('/api/attendance/:id', (req, res) => {
  const { pin } = req.body;
  if (pin !== ADMIN_PIN) return res.status(401).json({ error: '권한 없음' });
  const data = readData();
  data.attendees = data.attendees.filter(a => a.id !== Number(req.params.id));
  writeData(data);
  res.json({ success: true });
});

app.get('/api/export', (req, res) => {
  const pin = req.query.pin;
  if (pin !== ADMIN_PIN) return res.status(401).send('권한 없음');
  const data = readData();
  let csv = '소속 팀,이름,출석 시간\n';
  data.attendees.forEach(a => {
    csv += `"${a.team}","${a.name}","${kstTime(a.attended_at)}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send('\uFEFF' + csv);
});

app.get('/api/qr', async (req, res) => {
  const host = req.get('host');
  const url = `http://${host}/attend`;
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
  console.log(`서버 실행: http://localhost:${PORT}`);
  console.log(`같은 네트워크: http://[내IP]:${PORT}`);
});
