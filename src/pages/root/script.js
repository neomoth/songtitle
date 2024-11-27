//import ReconnectingWebSocket from 'reconnecting-websocket';

//im lazy so im sticking this here fuck you
//function parseIRC = function(data){
//	var message = {
//		raw:data,
//		tags:{},
//		prefix:null,
//		command:null,
//		params:[]
//	};
//	var position=0;
//	var nextspace=0;
//
//	if(data.charCodeAt(0)===64){
//		var nextspace = data.indexOf(' ');
//		if(nextspace===-1) return null;
//		var rawTags = data.slice(1,nextspace).split(';');
//		for(var i=0;i<rawTags.length;i++){
//			var tag = rawTags[i];
//			var pair = tag.split('=');
//			message.tags[pair[0]]=pair[1] || true;
//		}
//		position=nextspace+1;
//	}
//
//	while (data.charCodeAt(position)===32)position++;
//
//	if(data.charCodeAt(position)===58){
//		nextspace = data.indexOf(' ', potision);
//		if(nextspace===-1) return null;
//		message.prefix=data.slice(position+1,nextspace);
//		position=nextspace+1;
//		while(data.charCodeAt(position)===32)position++;
//	}
//
//	nextspace = data.indexOf(' ',position);
//
//	if(nextspace===-1){
//		if(data.length>position){
//			message.command=data.slice(position);
//			return message;
//		}
//		return null;
//	}
//
//	message.command = data.slice(position, nextspace);
//	position = nextspace+1;
//
//	while(position<data.length){
//		nextspace = data.indexOf(' ',position);
//		if data.charCodeAt(position)===58){
//			message.params.push(data.slice(position+1));
//			break;
//		}
//		if(nextspace!==-1){
//			message.params.push(data.slice(position,nextspace));
//			position=nextspace+1;
//
//			while(data.charCodeAt(position)===32)position++;
//			continue;
//		}
//
//		if (nextspace===-1){
//			message.params.push(data.slice(position));
//			break;
//		}
//	}
//	return message;
//}




const isLoggedIn = document.cookie.includes('accessToken');
if(!isLoggedIn) document.getElementById('loginModal').style.display="flex";
console.log(isLoggedIn)
const CLIENT_ID = '198a9772670340b198435b615c0f3e19';
const REDIRECT_URI = 'https://song.moth.li/oauth';
const SCOPES = 'user-read-currently-playing user-read-playback-state';
const title = document.getElementById('songTitle');
const artist = document.getElementById('songArtist');
const progressBar = document.getElementById('progress');
const status = document.getElementById('status');
const cover = document.getElementById('cover');
const progressBack = document.getElementById('progressBack');
let settings = {
	hideOnPause: false,
	useLocalhost: false,
	doFadeOut: false,
	doDropShadow: false
}

document.getElementById("loginButton").addEventListener("click", ()=>{
	const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(settings.useLocalHost ? "http://localhost:7934/oauth" : REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`
	window.location.href=authUrl;
});

//let allowAnimation = true;

let anims = {
	titleanim:null,
	artistanim:null
}

function stopAnim(anim){
//	allowAnimation = false;
	if(anim==null) return;
	cancelAnimationFrame(anim.id);
	anim.element.style.transform = 'translateX(0)';
	for(let timeout of anim.timeouts){
		clearTimeout(timeout);
	}
	anim = null;
}

function startScrollAnimation(element, container){
	const containerWidth = container.offsetWidth;
	const textWidth = element.offsetWidth;

	element.style.transform = `translateX(0)`;

	let animdata = {
		timeouts:[],
		id:null,
		element:element
	}

	let lastTimestamp = 0;
	let startTime;
	let position = 0;
	const speed = 0.1;
	const pauseDuration = 1000;
	let isPaused = true;
	//let timeouts = [];

	animdata.timeouts.push(setTimeout(()=>{
		isPaused = false;
	}, 1000));

	function animateScroll(timestamp){
		if(!lastTimestamp) lastTimestamp = timestamp;
		if(!startTime) startTime = timestamp;
		const elapsed = timestamp - startTime;
		const deltaTime = timestamp - lastTimestamp
		lastTimestamp = timestamp;

		if(!isPaused){
			position-=speed * deltaTime;

			const textRightEdge = element.getBoundingClientRect().right;
			const containerRightEdge = container.getBoundingClientRect().right;

			if (textRightEdge <= containerRightEdge && !isPaused){
				isPaused = true;
				animdata.timeouts.push(setTimeout(()=>{
					position=0;
					animdata.timeouts.push(setTimeout(()=>{
						isPaused = false;
						startTime = timestamp;
					}, pauseDuration));
				}, pauseDuration));
			}

			element.style.transform = `translateX(${position}px)`
		}
		animdata.id = requestAnimationFrame(animateScroll);
	}
	animdata.id = requestAnimationFrame(animateScroll);
	return animdata;
}

function fetchNowPlaying(){
	fetch('/api/nowplaying')
		.then((response)=>response.json())
		.then((data)=>{
			if(data.song && data.artist){
				const progress = (data.progress/data.duration) * 100;
				const oldtitle = title.innerText;
				const oldartist = artist.innerText;
				if (settings.hideOnPause) document.querySelector('.now-playing').style.cssText = data.playing ? "" : "display:none;"
				title.innerText = data.song;
				artist.innerText = data.artist;
				artist.style.display = '';
				status.src = data.playing ? "/assets/play.svg" : "/assets/pause.svg"
				console.log(data.cover)
				console.log(data.cover!=null)
				cover.src = data.cover!=null ? data.cover : "/assets/weestspin.gif"
				progressBar.style.width = `${progress}%`
				document.getElementById('songTitle').classList.add('scrolling-text');
//				if(title.innerText!=oldtitle||artist.innerText!=oldartist) stopAnim();
				if(title.innerText!=oldtitle) {
					stopAnim(anims.titleanim);
					title.style.width = 'auto';
					const songContainer = document.getElementById('songContainer');
					if(title.offsetWidth>songContainer.offsetWidth) {
						anims.titleanim = startScrollAnimation(title, songContainer);
						if (settings.doDropShadow) title.style.width = `${title.offsetWidth+5}px`;
						if (settings.doFadeOut) title.style.width = `${title.offsetWidth+32}px`;
					}
				}
				if(artist.innerText!=oldartist) {
					stopAnim(anims.artistanim);
					artist.style.width = 'auto';
					const artistContainer = document.getElementById('artistContainer');
					if(artist.offsetWidth>artistContainer.offsetWidth) {
						anims.artistanim = startScrollAnimation(artist, artistContainer);
						if (settings.doDropShadow) artist.style.width = `${artist.offsetWidth+5}px`;
						if (settings.doFadeOut) artist.style.width = `${artist.offsetWidth+32}px`;
					}
				}
			} else{
				progress.style.width='0';
				status.src='/assets/error.svg';
				title.innerText = 'No song currently playing.';
				title.classList.remove('scrolling-text');
				cover.src = "/assets/weestspin.gif";
				if(settings.hideOnPause) document.querySelector('.now-playing').style.display = 'none';
				stopAnim(anims.titleanim);
				stopAnim(anims.artistanim);
				title.style.animation='';
				artist.style.animation='';
				artist.innerText = '';
				artist.style.display='none';
			}
		})
		.catch((error)=>{
			console.error('Failed fetching now playing:', error);
		});
}

function refreshToken(){
	fetch('/api/refreshtoken')
		.then((response)=>response.json())
		.then((data)=>{
			if(data.success) console.log('Refreshed token.');
			else console.error('Failed to refresh token. Please log in again.');
		});
}

let interval = setInterval(()=>{
	console.log("running fetch");
	fetchNowPlaying();
	console.log("ran fetch");
}, 5000);
fetchNowPlaying();

setInterval(refreshToken, 30*60*1000);
refreshToken();

const params = new URLSearchParams(window.location.search);
if(params.get('showcover')=="false"){
	document.getElementById('cover').style.display='none';
	document.querySelector('.now-playing .top').style.gap='0';
}
if(params.get('showplayback')=="false"){
	document.getElementById('status').style.display='none';
	document.getElementById('progress').style.display='none';
	document.querySelector('.progress-back').style.display='none';
}
if(params.get('showstatus')=="false"){
	document.getElementById('status').style.display='none';
	document.querySelector('.now-playing .bottom').style.gap='0';
}
if(params.get('hideonpause')=="true"){
	settings.hideOnPause = true;
}
if(params.get('uselocalhost')=="true"){
	settings.useLocalHost = true;
}
if(params.get('dofadeout')=="true"){
	console.log("penis");
	settings.doFadeOut = true;
	document.querySelector('.now-playing .top').style.cssText += 'mask-image:linear-gradient(90deg, #000 88%, transparent);';
}
if(params.get('dropshadow')=="true"){
	settings.doDropShadow=true;
	title.style.textShadow="2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black";
	title.style.paddingLeft="3px";
	artist.style.textShadow="2px 2px 4px black, -2px -2px 4px black, 2px -2px 4px black, -2px 2px 4px black";
	artist.style.paddingLeft="3px";
	progressBack.style.filter='drop-shadow(2px 2px 2px black)';
	status.style.filter='drop-shadow(2px 2px 2px white) invert(100%)';
	cover.style.filter='drop-shadow(2px 2px 2px black)';
}
if(params.has('clearcookies')){
	document.cookie = 'accessToken=""';
	document.cookie = 'refreshToken=""';
	window.location.refresh();
}
if(params.has('cssprops')){
	const props = params.get('cssprops');
	for(let prop of props.split(';')){
		console.log(prop);
		let key = prop.split(':')[0];
		let value = prop.split(':')[1];
		console.log(key);
		console.log(value);
		document.body.style.cssText+=`--${key}:${value};`
	}
}

let ws;

function connectWebSocket(){
	const protocol = location.protocol=='https:'?'wss':'ws';
	const port = location.port?':7395':'/ws';
	ws = new WebSocket(`${protocol}://${window.location.hostname}${port}`);
	ws.onopen=()=>{
		console.log('connected to websocket');
		ws.send(JSON.stringify({
			protocol:'SET_IDENTIFIER',
			data:params.has('identifier')?params.get('identifier'):undefined
		}));
	}
	ws.onmessage=(msg)=>{
		console.log(msg.data);
	}
	ws.onclose=()=>{
		setTimeout(connectWebSocket,1000);
	}
	ws.onerror=(err)=>{
		console.error(err);
	}
}
//connectWebSocket();


//const socket = new ReconnectingWebSocket('wss://irc-ws.chat.twitch.tv', 'irc', {reconnectInterval: 2000});
//socket.onopen=async()=>{
//	console.log('connecting to channel');
//	socket.send('PASS bla\r\n');
//	socket.send('NICK jistinfan' + Math.floor(Math.random()*99999)+'\r\n');
//	socket.send('CAP REQ :twitch.tv/commands twitch.tv/tags\r\n');
//	socket.send('JOIN #neomothdev\r\n');
//	console.log('connected.');
//};
//socket.onclose=()=>{
//	console.log('disconnected from channel');
//};
//socket.onmessage=(data)=>{
//	console.log(data);
//};
//socket.onerror=(err)=>{
//	console.error(err);
//};
//	data.data.split('\r\n').forEach(line=>{
//		if(!line) return;
//		let message = parseIRC(line);
//		if(!message.command) return;
//
//		switch(message.command){
//			case "PING": return socket.send('PONG ' + message.params[0]);
//			case "JOIN": return console.log('joined channel');
//			case "PRIVMSG":
//				if (message.params[0]!=='#neomothdev'||!message.params[1])return;
//				return parseCommand(message,false);
//		}
//	});
//};
//
//function parseCommand(message, defaultToCurrentChannel = true){
//	let nick = message.prefix.split('@')[0].split('!')[0];
//	let text = message.params[1];
//
//	let channelParamMatch = text.match(/ -c ([\S\d_]+)/);
//	if (channelParamMatch){
//		text=text.substr(0, channelParamMatch.index)
//			+ text.substr(channelParamMatch.index + channelParamMatch[0].length);
//		let channelParam ( (channelParamMatch||[])[1]||(defaultToCurrentChannel ?
//	}
//}

