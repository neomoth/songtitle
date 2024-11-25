const isLoggedIn = document.cookie.includes('accessToken');
if(!isLoggedIn) document.getElementById('loginModal').style.display="flex";
console.log(isLoggedIn)
const CLIENT_ID = '198a9772670340b198435b615c0f3e19';
const REDIRECT_URI = 'https://song.moth.li/oauth';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

document.getElementById("loginButton").addEventListener("click", ()=>{
	const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`
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

	setTimeout(()=>{
		isPaused = false;
	}, 1000);

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

			if (textRightEdge <= containerRightEdge){
				isPaused = true;
				setTimeout(()=>{
					position=0;
					setTimeout(()=>{
						isPaused = false;
						startTime = timestamp;
					}, pauseDuration);
				}, pauseDuration);
			}

			element.style.transform = `translateX(${position}px)`
		}
		if(allowAnimation) requestAnimationFrame(animateScroll);
	}
	requestAnimationFrame(animateScroll);
}

function fetchNowPlaying(){
	fetch('/api/nowplaying')
		.then((response)=>response.json())
		.then((data)=>{
			if(data.song && data.artist){
				const title = document.getElementById('songTitle');
				const artist = document.getElementById('songArtist');
				const progress = (data.progress/data.duration) * 100;
				const progressBar = document.getElementById('progress');
				const status = document.getElementById('status');
				const cover = document.getElementById('cover');
				const oldtitle = title.innerText;
				const oldartist = artist.innerText;
				title.innerText = data.song;
				artist.innerText = data.artist;
				status.src = data.playing ? "play.svg" : "pause.svg"
				console.log(data.cover)
				console.log(data.cover!=null)
				cover.src = data.cover!=null ? data.cover : "weestspin.gif"
				progressBar.style.width = `${progress}%`;
//				const songWidth = title.offsetWidth;
//				const artistWidth = artist.offsetWidth;
//				const titleContainerWidth = document.getElementById('songContainer').offsetWidth;
//				const artistContainerWidth = document.getElementById('artistContainer').offsetWidth;
//				if (songWidth>titleContainerWidth){
//					const scrollSpeed = 80;
//					const duration = (songWidth+titleContainerWidth)/scrollSpeed;
//					title.style.animation = `scroll-infinite ${duration}s linear infinite forwards`;
//				}
//				if (artistWidth>artistContainerWidth){
//					const scrollSpeed = 100;
//					const duration = (artistWidth+artistContainerWidth)/scrollSpeed;
//					artist.style.animation = `scroll-infinite ${duration}s linear infinite forwards`;
//				}
				document.getElementById('songTitle').classList.add('scrolling-text');
//				document.getElementById('songTitle').classList.add('scrolling-text');
				if(title.innerText!=oldtitle) {
					const songContainer = document.getElementById('songContainer');
					if(title.offsetWidth>songContainer.offsetWidth) startScrollAnimation(title, songContainer);
				}
				if(artist.innerText!=oldartist) {
					const artistContainer = document.getElementById('artistContainer');
					if(artist.offsetWidth>artistContainer.offsetWidth) startScrollAnimation(artist, artistContainer);
				}
			} else{
				document.getElementById('progress').style.width='0';
				document.getElementById('status').src='error.svg';
				document.getElementById('songTitle').innerText = 'No song currently playing.';
				document.getElementById('songTitle').classList.remove('scrolling-text');
				document.getElementById('cover').src = "weestspin.gif";
				stopAnim();
//				document.getElementById('titleContainer').classList.add('loading');
				document.getElementById('songTitle').style.animation='';
				document.getElementById('songArtist').style.animation='';
				document.getElementById('songArtist').innerText = '';
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
