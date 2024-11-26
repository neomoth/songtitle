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

let allowAnimation = true;

function stopAnim(){
	allowAnimation = false;
	document.getElementById('songTitle').style.transform = 'translateX(0)'
	document.getElementById('songArtist').style.transform = 'translateX(0)'
}

function startScrollAnimation(element, container){
	const containerWidth = container.offsetWidth;
	const textWidth = element.offsetWidth;

	element.style.transform = `translateX(0)`;

	allowAnimation = true;
	let lastTimestamp = 0;
	let startTime;
	let position = 0;
	const speed = 0.1;
	const pauseDuration = 1000;
	let isPaused = true;
	let timeouts = [];

	setTimeout(()=>{
		isPaused = false;
	}, 1000);

	function animateScroll(timestamp){
		if(!lastTimestamp) lastTimestamp = timestamp;
		if(!startTime) startTime = timestamp;
		const elapsed = timestamp - startTime;
		const deltaTime = timestamp - lastTimestamp
		lastTimestamp = timestamp;

		if(!isPaused && allowAnimation){
			position-=speed * deltaTime;

			const textRightEdge = element.getBoundingClientRect().right;
			const containerRightEdge = container.getBoundingClientRect().right;

			if (textRightEdge <= containerRightEdge && !isPaused && allowAnimation){
				isPaused = true;
				timeouts.push(setTimeout(()=>{
					position=0;
					timeouts.push(setTimeout(()=>{
						isPaused = false;
						startTime = timestamp;
					}, pauseDuration));
				}, pauseDuration));
			}

			element.style.transform = `translateX(${position}px)`
		}
		if(allowAnimation) requestAnimationFrame(animateScroll);
		else for(let timeout in timeouts){
			clearTimeout(timeout);
		}
	}
	requestAnimationFrame(animateScroll);
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
				status.src = data.playing ? "play.svg" : "pause.svg"
				console.log(data.cover)
				console.log(data.cover!=null)
				cover.src = data.cover!=null ? data.cover : "weestspin.gif"
				progressBar.style.width = `${progress}%`
				document.getElementById('songTitle').classList.add('scrolling-text');
				if(title.innerText!=oldtitle) {
					title.style.width = 'auto';
					const songContainer = document.getElementById('songContainer');
					if(title.offsetWidth>songContainer.offsetWidth) {
						startScrollAnimation(title, songContainer);
						if (settings.doDropShadow) title.style.width = `${title.offsetWidth+5}px`;
						if (settings.doFadeOut) title.style.width = `${title.offsetWidth+32}px`;
					}
				}
				if(artist.innerText!=oldartist) {
					artist.style.width = 'auto';
					const artistContainer = document.getElementById('artistContainer');
					if(artist.offsetWidth>artistContainer.offsetWidth) {
						startScrollAnimation(artist, artistContainer);
						if (settings.doDropShadow) artist.style.width = `${artist.offsetWidth+5}px`;
						if (settings.doFadeOut) artist.style.width = `${artist.offsetWidth+32}px`;
					}
				}
			} else{
				progress.style.width='0';
				status.src='error.svg';
				title.innerText = 'No song currently playing.';
				title.classList.remove('scrolling-text');
				cover.src = "weestspin.gif";
				if(settings.hideOnPause) document.querySelector('.now-playing').style.display = 'none';
				stopAnim();
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

setInterval(fetchNowPlaying, 5000);
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
