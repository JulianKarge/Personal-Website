// Wait for the DOM to be fully loaded before running scripts
document.addEventListener("DOMContentLoaded", function () {
  // --- General & Navigation ---
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileMenuIcon = mobileMenuButton.querySelector("i");

  mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    mobileMenuIcon.classList.toggle("fa-bars");
    mobileMenuIcon.classList.toggle("fa-times");
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerOffset = document.querySelector("header").offsetHeight;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }

      if (
        !mobileMenu.classList.contains("hidden") &&
        mobileMenu.contains(this)
      ) {
        mobileMenu.classList.add("hidden");
        mobileMenuIcon.classList.remove("fa-times");
        mobileMenuIcon.classList.add("fa-bars");
      }
    });
  });

  // --- Music Player ---
  const musicPlayerEl = document.getElementById("music-player");
  const audioPlayer = document.getElementById("audio-element");
  const playPauseBtn = document.getElementById("player-play-pause-btn");
  const playIcon = playPauseBtn.querySelector("i");
  const prevBtn = document.getElementById("player-prev-btn");
  const nextBtn = document.getElementById("player-next-btn");
  const albumArtImg = document.getElementById("player-album-art");
  const songTitleEl = document.getElementById("player-song-title");
  const songArtistEl = document.getElementById("player-song-artist");
  const playlistListEl = document.getElementById("playlist-list");
  const minimizeBtn = document.getElementById("player-minimize-btn");
  const minimizeIcon = minimizeBtn.querySelector("i");

  const songs = [
    {
      title: "Wacuka",
      artist: "AVAION",
      src: "music/AVAION, Sofiya Nzau - Wacuka (Official Visualizer).mp3",
      cover: "Images/MusikCover/Wacuka.jpg",
    },
    {
      title: "Heatwave",
      artist: "Nyck Caution",
      src: "music/ES_Heatwave (Clean Version) - Nyck Caution.wav",
      cover: "Images/MusikCover/Heatwave.jpg",
    },
    {
      title: "Need it",
      artist: "dreem",
      src: "music/ES_need it - dreem.wav",
      cover: "Images/MusikCover/NeedIt.jpg",
    },
    {
      title: "Weaver",
      artist: "dreem",
      src: "music/ES_weaver - dreem.wav",
      cover: "Images/MusikCover/Weaver.jpg",
    },
    {
      title: "Take Me To U",
      artist: "LeDorean",
      src: "music/ES_Take Me to U - LeDorean.wav",
      cover: "Images/MusikCover/TakeMeToU.jpg",
    },
  ];

  let currentSongIndex = 0;
  let hasUserInitiatedPlay = false;

  function loadSong(songIndex) {
    if (songs.length === 0) return;
    const song = songs[songIndex];
    audioPlayer.src = song.src;
    songTitleEl.textContent = song.title;
    songArtistEl.textContent = song.artist;
    if (albumArtImg && song.cover) {
      albumArtImg.src = song.cover;
    } else if (albumArtImg) {
      albumArtImg.src = "Images/Logo.png";
    }
    updatePlaylistUI();
  }

  audioPlayer.addEventListener("play", () => {
    playIcon.classList.remove("fa-play");
    playIcon.classList.add("fa-pause");
    hasUserInitiatedPlay = true;
  });

  audioPlayer.addEventListener("pause", () => {
    playIcon.classList.remove("fa-pause");
    playIcon.classList.add("fa-play");
  });

  function togglePlayPause() {
    if (songs.length === 0) return;
    if (audioPlayer.paused) {
      audioPlayer.play().catch(error => console.error("Playback failed:", error));
    } else {
      audioPlayer.pause();
    }
  }

  function playNextSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
    if (hasUserInitiatedPlay) {
      audioPlayer.play();
    }
  }

  function playPrevSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
    if (hasUserInitiatedPlay) {
      audioPlayer.play();
    }
  }

  function populatePlaylist() {
    if (songs.length === 0) {
      playlistListEl.innerHTML = "<li>No songs in playlist.</li>";
      return;
    }
    playlistListEl.innerHTML = "";
    songs.forEach((song, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${song.title} - ${song.artist}`;
      listItem.setAttribute("data-index", index);
      listItem.addEventListener("click", () => {
        currentSongIndex = index;
        loadSong(currentSongIndex);
        audioPlayer.play();
      });
      playlistListEl.appendChild(listItem);
    });
    updatePlaylistUI();
  }

  function updatePlaylistUI() {
    if (songs.length === 0) return;
    const items = playlistListEl.querySelectorAll("li");
    items.forEach((item) => {
      const index = parseInt(item.getAttribute("data-index"), 10);
      item.classList.toggle("active-song", index === currentSongIndex);
    });
  }

  if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlayPause);
  if (prevBtn) prevBtn.addEventListener("click", playPrevSong);
  if (nextBtn) nextBtn.addEventListener("click", playNextSong);
  if (audioPlayer) audioPlayer.addEventListener("ended", playNextSong);

  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      musicPlayerEl.classList.toggle("player-minimized");
      minimizeIcon.classList.toggle("fa-chevron-down");
      minimizeIcon.classList.toggle("fa-chevron-up");
    });
  }
  
  function attemptAutoplay() {
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn("Autoplay was prevented. Waiting for user interaction.");
        const startOnFirstInteraction = () => {
          audioPlayer.play().catch(e => console.error("Playback failed after interaction:", e));
          document.removeEventListener("click", startOnFirstInteraction);
          document.removeEventListener("touchstart", startOnFirstInteraction);
        };
        document.addEventListener("click", startOnFirstInteraction);
        document.addEventListener("touchstart", startOnFirstInteraction);
      });
    }
  }

  if (songs.length > 0) {
    loadSong(currentSongIndex);
    populatePlaylist();
    attemptAutoplay();
  } else {
    populatePlaylist();
  }

  // --- Name Typewriter Animation ---
  const namePlaceholder = document.getElementById("animated-name-placeholder");
  if (namePlaceholder) {
    const phrases = [
      { text: "Julian Lucca Karge", isJLZN: false },
      { text: "JLZN", isJLZN: true },
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 120;
    const deletingSpeed = 70;
    const pauseBetweenPhrases = 3000;

    function typeWriter() {
      const currentPhraseObj = phrases[phraseIndex];
      const currentText = currentPhraseObj.text;
      let displayedText = "";

      if (isDeleting) {
        displayedText = currentText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        displayedText = currentText.substring(0, charIndex + 1);
        charIndex++;
      }
      namePlaceholder.textContent = displayedText;

      if (currentPhraseObj.isJLZN) {
        namePlaceholder.classList.add("jlzn-font-style");
        namePlaceholder.style.setProperty("--cursor-color", "#e94560");
      } else {
        namePlaceholder.classList.remove("jlzn-font-style");
        namePlaceholder.style.setProperty("--cursor-color", "white");
      }

      let timeToNextChar = isDeleting ? deletingSpeed : typingSpeed;

      if (!isDeleting && charIndex === currentText.length) {
        timeToNextChar = pauseBetweenPhrases;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timeToNextChar = 500;
      }
      setTimeout(typeWriter, timeToNextChar);
    }
    typeWriter();
  }

  // --- "About Me" Slider ---
  const sliderContainer = document.getElementById("about-slider");
  const sliderTrack = document.getElementById("slider-track");
  const slides = document.querySelectorAll(".about-slide");
  const prevButton = document.getElementById("prev-slide");
  const nextButton = document.getElementById("next-slide");
  const dotsContainer = document.getElementById("slider-dots");

  if (sliderTrack && slides.length > 0) {
    let currentIndex = 0;
    const totalSlides = slides.length;

    slides.forEach((slide, index) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      dot.addEventListener("click", () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll(".dot");

    function updateSlider() {
      sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === currentIndex);
      });
    }

    function goToSlide(index) {
      currentIndex = index;
      updateSlider();
    }
    
    function showNextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlider();
    }

    function showPrevSlide() {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlider();
    }

    nextButton.addEventListener("click", showNextSlide);
    prevButton.addEventListener("click", showPrevSlide);

    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50;

    sliderContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      if (touchEndX < touchStartX - swipeThreshold) {
        showNextSlide();
      } else if (touchEndX > touchStartX + swipeThreshold) {
        showPrevSlide();
      }
    }
    
    updateSlider();
  }

  // --- Fetch Latest YouTube Video ---
  const channelId = "UCeYrf35hRiF6Rj-RueYrHCQ";
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  const videoLinkWrapper = document.getElementById("latest-video-link-wrapper");
  const videoThumbnail = document.getElementById("latest-video-thumbnail");
  const videoTitle = document.getElementById("latest-video-title");
  const videoDescription = document.getElementById("latest-video-description");

  function isVideoShort(item) {
    if (item.title.toLowerCase().includes("#shorts")) {
      return true;
    }
    if (item.link && item.link.includes("/shorts/")) {
      return true;
    }
    return false;
  }

fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl) + "&_=" + new Date().getTime()
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.status !== 'ok' || !data.items || data.items.length === 0) {
        throw new Error("No videos found in the feed.");
      }
      
      const latestVideo = data.items.find(item => !isVideoShort(item));

      if (latestVideo) {
        videoLinkWrapper.href = latestVideo.link;
        videoTitle.href = latestVideo.link;
        videoThumbnail.src = latestVideo.thumbnail;
        videoThumbnail.alt = latestVideo.title;
        videoTitle.textContent = latestVideo.title;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = latestVideo.description;
        let cleanDescription = tempDiv.textContent || "";
        
        const maxLength = 150;
        if (cleanDescription.length > maxLength) {
          let lastSpace = cleanDescription.substring(0, maxLength).lastIndexOf(' ');
          cleanDescription = cleanDescription.substring(0, lastSpace > 0 ? lastSpace : maxLength) + "...";
        }
        
        videoDescription.textContent = cleanDescription;

      } else {
        videoTitle.textContent = "Kein aktuelles langes Video gefunden.";
        videoDescription.textContent = "Schau direkt auf meinem Kanal vorbei, um die neuesten Shorts zu sehen!";
      }
    })
    .catch((err) => {
      console.error("Error loading latest video:", err);
      videoTitle.textContent = "Fehler beim Laden des Videos";
      videoDescription.textContent = "Die Video-Daten konnten nicht abgerufen werden.";
    });

});