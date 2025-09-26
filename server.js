import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
	cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado em memória. Em produção, use um banco.
const state = {
	cars: new Map(), // id -> { id, name, color }
	times: new Map() // carId -> [ms, ms, ...]
};

const DATA_FILE = path.join(__dirname, 'data.json');

async function loadData() {
	try {
		const content = await fs.readFile(DATA_FILE, 'utf8');
		const json = JSON.parse(content);
		state.cars = new Map((json.cars || []).map(c => [c.id, c]));
		state.times = new Map((json.times || []).map(t => [t.carId, t.times]));
		broadcastState();
		console.log('Dados carregados de', DATA_FILE);
	} catch (err) {
		if (err.code === 'ENOENT') {
			console.log('Nenhum arquivo de dados encontrado. Iniciando vazio.');
			return;
		}
		console.error('Falha ao carregar dados:', err.message);
	}
}

let saveTimer = null;
async function saveData() {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(async () => {
		const json = {
			cars: Array.from(state.cars.values()),
			times: Array.from(state.times.entries()).map(([carId, arr]) => ({ carId, times: arr }))
		};
		const tmp = DATA_FILE + '.tmp';
		try {
			await fs.writeFile(tmp, JSON.stringify(json, null, 2), 'utf8');
			await fs.rename(tmp, DATA_FILE);
			console.log('Dados salvos em', DATA_FILE);
		} catch (err) {
			console.error('Falha ao salvar dados:', err.message);
		}
	}, 200);
}

function toMs(input) {
	// Aceita ms (number) ou string "MM:SS.mmm"/"SS.mmm"
	if (typeof input === 'number' && Number.isFinite(input)) return Math.max(0, Math.floor(input));
	if (typeof input !== 'string') return null;
	const s = input.trim();
	const mm = s.match(/^(\d+):(\d{1,2})\.(\d{1,3})$/);
	if (mm) {
		const minutes = parseInt(mm[1], 10);
		const seconds = parseInt(mm[2], 10);
		const millis = parseInt(mm[3].padEnd(3, '0'), 10);
		if (seconds >= 60) return null;
		return (minutes * 60 + seconds) * 1000 + millis;
	}
	const ss = s.match(/^(\d+?)\.(\d{1,3})$/);
	if (ss) {
		const seconds = parseInt(ss[1], 10);
		const millis = parseInt(ss[2].padEnd(3, '0'), 10);
		return seconds * 1000 + millis;
	}
	const asNum = Number(s);
	return Number.isFinite(asNum) ? Math.max(0, Math.floor(asNum)) : null;
}

function formatMs(ms) {
	const minutes = Math.floor(ms / 60000);
	const seconds = Math.floor((ms % 60000) / 1000);
	const millis = ms % 1000;
	if (minutes > 0) {
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
	}
	return `${seconds}.${String(millis).padStart(3, '0')}`;
}

function computeRanking() {
	const entries = [];
	for (const [carId, car] of state.cars.entries()) {
		const arr = state.times.get(carId) || [];
		if (arr.length === 0) continue;
		const best = Math.min(...arr);
		entries.push({
			carId,
			name: car.name,
			color: car.color,
			best,
			count: arr.length
		});
	}
	entries.sort((a, b) => a.best - b.best);
	return entries.map((e, idx) => ({ position: idx + 1, ...e }));
}

function broadcastState() {
	io.emit('state:update', {
		cars: Array.from(state.cars.values()),
		times: Array.from(state.times.entries()).map(([carId, arr]) => ({ carId, times: arr })),
		ranking: computeRanking()
	});
}

// Endpoints REST simples
app.get('/api/state', (req, res) => {
	res.json({
		cars: Array.from(state.cars.values()),
		times: Array.from(state.times.entries()).map(([carId, arr]) => ({ carId, times: arr })),
		ranking: computeRanking()
	});
});

app.post('/api/cars', (req, res) => {
	const { name, color } = req.body || {};
	if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Nome inválido' });
	const id = uuidv4();
	const car = { id, name: name.trim(), color: color || '#444' };
	state.cars.set(id, car);
	state.times.set(id, []);
	broadcastState();
	saveData();
	res.status(201).json(car);
});

app.delete('/api/cars/:id', (req, res) => {
	const { id } = req.params;
	if (!state.cars.has(id)) return res.status(404).json({ error: 'Carrinho não encontrado' });
	state.cars.delete(id);
	state.times.delete(id);
	broadcastState();
	saveData();
	res.json({ ok: true });
});

app.post('/api/times/:carId', (req, res) => {
	const { carId } = req.params;
	const { time } = req.body || {};
	if (!state.cars.has(carId)) return res.status(404).json({ error: 'Carrinho não encontrado' });
	const ms = toMs(time);
	if (ms == null) return res.status(400).json({ error: 'Tempo inválido. Use ms ou MM:SS.mmm/SS.mmm' });
	const arr = state.times.get(carId) || [];
	arr.push(ms);
	state.times.set(carId, arr);
	broadcastState();
	saveData();
	res.status(201).json({ carId, ms, formatted: formatMs(ms) });
});

app.delete('/api/times/:carId/:index', (req, res) => {
	const { carId, index } = req.params;
	if (!state.cars.has(carId)) return res.status(404).json({ error: 'Carrinho não encontrado' });
	const i = Number(index);
	const arr = state.times.get(carId) || [];
	if (!Number.isInteger(i) || i < 0 || i >= arr.length) return res.status(400).json({ error: 'Índice inválido' });
	arr.splice(i, 1);
	state.times.set(carId, arr);
	broadcastState();
	saveData();
	res.json({ ok: true });
});

io.on('connection', (socket) => {
	// Envia estado atual ao novo cliente
	socket.emit('state:update', {
		cars: Array.from(state.cars.values()),
		times: Array.from(state.times.entries()).map(([carId, arr]) => ({ carId, times: arr })),
		ranking: computeRanking()
	});
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function bootstrap() {
	await loadData();
	server.listen(PORT, () => {
		console.log(`🚀 Servidor iniciado em ${NODE_ENV === 'production' ? 'produção' : 'desenvolvimento'}`);
		console.log(`📡 Porta: ${PORT}`);
		console.log(`🌐 URL: ${NODE_ENV === 'production' ? 'https://sua-app.railway.app' : `http://localhost:${PORT}`}`);
		console.log(`📊 Placar: ${NODE_ENV === 'production' ? 'https://sua-app.railway.app' : `http://localhost:${PORT}`}`);
		console.log(`⚙️ Admin: ${NODE_ENV === 'production' ? 'https://sua-app.railway.app/admin.html' : `http://localhost:${PORT}/admin.html`}`);
	});
}

bootstrap();


