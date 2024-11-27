const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const {encode} = require('url-safe-base64');
const path = require('path');
//const ReconnectingWebSocket = require('reconnecting-websocket');
const WebSocket = require('ws');
const readline = require('readline');

const wss = new WebSocket.Server({port:7395});

function heartbeat(){
	this.isAlive = true;
}
wss.on('connection', (ws)=>{
	console.log('connection open');
	ws.isAlive = true;
	ws.on('pong', heartbeat);
	ws.on('message', (message)=>{
		switch(message.protocol){
			case "SET_IDENTIFIER":
				ws.identifier = message.data;
				console.log(message.data);
				return ws.send("got it");
		}
	});
	ws.on('close', ()=>{
		console.log('connection closed');
	});
	ws.on('error', (err)=>{
		console.info('encountered an error, likely a malformed ws message.');
		console.error(err);
	});
});

dotenv.config();

const app = express();
const port = 7394;

app.locals.wss = wss;
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('build'));
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/', async (req,res)=>{
	res.sendFile(path.join(__dirname, 'build', 'root/index.html'))
});

app.get('/oauth', async (req,res)=>{
	const code = req.query.code;
	console.log(code);
	console.log(CLIENT_SECRET);
	const text = `${CLIENT_ID}:${CLIENT_SECRET}`;
	console.log(text);
	try{
		const tokenResponse = await axios.post(
			'https://accounts.spotify.com/api/token',
			new URLSearchParams({
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: REDIRECT_URI,
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
//					'Authorization': `Basic ${encode(text)}`
				}
			}
		);

		const { access_token, refresh_token } = tokenResponse.data;

		res.cookie('accessToken', access_token, {httpOnly: false, secure: true, maxAge:10*365*24*60*60*1000});
		res.cookie('refreshToken', refresh_token, {httpOnly: false, secure: true, maxAge:10*365*24*60*60*1000});
		res.redirect('/');
	} catch (error) {
		console.error(error);
		console.error('Error exchanging token:', error.response.data);
		res.status(500).json({error: 'Failed to exchange token' });
	}
});

app.get('/api/refreshtoken', async (req,res)=>{
	try{
		const tokenResponse = await axios.post(
			'https://accounts.spotify.com/api/token',
			new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: req.cookies['refreshToken'],
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
			}),
			{ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
		);

		const { access_token } = tokenResponse.data;

		res.cookie('accessToken', access_token, {httpOnly: false, secure: true, maxAge:10*365*24*60*60*1000});
		res.redirect('/');
	} catch (error) {
		console.error(error);
		console.error('Error refreshing token:', error.response.data);
		res.clearCookie('accessToken');
		res.clearCookie('refreshToken');
		res.status(500).json({error: 'Failed to refresh token' });
	}
});

app.get('/api/nowplaying', async (req,res)=>{
	const token = req.cookies['accessToken'];
	if(!token){
		return res.status(401).json({error:'Not authorized.'});
	}
	try{
		const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (response.status === 204 || response.status > 400) {
			return res.json({song:null, artist:null, cover:null});
		}

		const { item, progress_ms, is_playing } = response.data;
		if(item==undefined) return res.status(500).json("Failed to get song info, trying again...");
		const song = item.name;
		const artist = item.artists.map((artist)=>artist.name).join(', ');
		const cover = item.album.images[0].url;
		const progress = progress_ms;
		const duration = item.duration_ms;
		const playing = is_playing;

		res.json({song, artist, cover, progress, duration, playing});
	}
	catch (error) {
		console.error(error);
		console.error('failed to fetch current song', error.response.data);
		res.status(500).json({error: "Failed to fetch currently playing song." });
	}
});

//app.post('/api/token', async (req,res)=>{
//	const { code } = req.body;
//	try{
//		const response = await axios.post(
//			'https://accounts.spotify.com/api/token',
//			new URLSearchParams({
//				grant_type: 'authorization_code',
//				code:code,
//				redirect_uri: REDIRECT_URI,
//				client_id: CLIENT_ID,
//				client_secret: CLIENT_SECRET,
//			}),
//			{headers:{'Content-Type':'application/x-www-form-urlencoded'}}
//		)
//		res.json(response.data);
//	} catch (error) {
//		console.error('Error exchanging token:', error.response.data);
//		res.status(500).json({error: 'Failed to exchange token' });
//	}
//});

function prompt(){
	const rl = readline.createInterface({input:process.stdin,output:process.stdout});
	rl.question("> ", async (cmd)=>{
		rl.close();
		await parseCommand(cmd);
		prompt();
	});
}

async function start(){
	await app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
	prompt();
}

function parseCommand(cmd){
	const args = cmd.split(' ').slice(1);
	cmd = cmd.split(' ')[0];
	console.log(cmd);
	console.log(args);
	switch(cmd){
		case "listws":
			for(let ws in wss.clients){
				console.log(ws);
			}
	}
}

start();

