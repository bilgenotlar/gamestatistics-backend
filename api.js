const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// CORS ve JSON middleware
app.use(cors());
app.use(express.json());

// Ana endpoint
app.get('/api/game/:name', async (req, res) => {
  try {
    const gameName = decodeURIComponent(req.params.name);
    console.log(`Oyun aranıyor: ${gameName}`);

    // Tüm verileri paralel olarak çek
    const [ratingsData, redditData, youtubeData, twitchData] = await Promise.allSettled([
      fetchRatings(gameName),
      fetchReddit(gameName),
      fetchYouTube(gameName),
      fetchTwitch(gameName)
    ]);

    // Sonuçları döndür (hata olsa da devam et)
    const response = {
      ratings: ratingsData.status === 'fulfilled' ? ratingsData.value : {},
      reddit: redditData.status === 'fulfilled' ? redditData.value : [],
      youtube: youtubeData.status === 'fulfilled' ? youtubeData.value : [],
      twitch: twitchData.status === 'fulfilled' ? twitchData.value : []
    };

    res.json(response);
  } catch (error) {
    console.error('API Hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Reddit'ten veri çek
async function fetchReddit(gameName) {
  try {
    const response = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(gameName)}&type=link&sort=relevance&t=month&limit=20`,
      {
        headers: {
          'User-Agent': 'Game-Intel-Extension/1.0'
        },
        timeout: 5000
      }
    );

    return response.data.data.children
      .filter(post => post.data.subreddit.toLowerCase().includes('gaming') || 
                      post.data.subreddit.toLowerCase().includes('games') ||
                      post.data.title.toLowerCase().includes(gameName.toLowerCase()))
      .slice(0, 10)
      .map(post => ({
        title: post.data.title,
        url: `https://reddit.com${post.data.permalink}`,
        upvotes: post.data.ups,
        comments: post.data.num_comments,
        subreddit: post.data.subreddit
      }));
  } catch (error) {
    console.error('Reddit hatası:', error.message);
    return [];
  }
}

// YouTube'dan veri çek
async function fetchYouTube(gameName) {
  try {
    // YouTube API kullanmadan Google'dan scrape
    const response = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' review')}&hl=en`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 5000
      }
    );

    // Basit regex ile video bilgileri çek
    const videoMatches = response.data.match(/"videoId":"([^"]+)"/g) || [];
    const titleMatches = response.data.match(/"title":\{"simpleText":"([^"]+)"/g) || [];

    // Dummy veri dönür (Vercel'de çalışması için)
    return [
      {
        videoId: 'dQw4w9WgXcQ',
        title: `${gameName} Full Review`,
        views: '1.2M',
        rating: '4.8/5'
      },
      {
        videoId: 'jNQXAC9IVRw',
        title: `${gameName} Gameplay`,
        views: '850K',
        rating: '4.7/5'
      },
      {
        videoId: '9bZkp7q19f0',
        title: `${gameName} Tips & Tricks`,
        views: '520K',
        rating: '4.9/5'
      }
    ];
  } catch (error) {
    console.error('YouTube hatası:', error.message);
    return [];
  }
}

// Twitch'ten veri çek
async function fetchTwitch(gameName) {
  try {
    // Twitch API kullanmadan dummy veri döndür
    return [
      {
        broadcaster: 'pro_gamer_1',
        title: `Playing ${gameName}`,
        viewers: '15,000',
        url: `https://twitch.tv/pro_gamer_1`
      },
      {
        broadcaster: 'streamer_pro',
        title: `${gameName} Chill Stream`,
        viewers: '8,500',
        url: `https://twitch.tv/streamer_pro`
      },
      {
        broadcaster: 'gaming_channel',
        title: `${gameName} Tournament`,
        viewers: '22,000',
        url: `https://twitch.tv/gaming_channel`
      }
    ];
  } catch (error) {
    console.error('Twitch hatası:', error.message);
    return [];
  }
}

// Puanlamalar (IMDb, Metacritic vb.)
async function fetchRatings(gameName) {
  try {
    // Dummy puanlama verileri
    return {
      'Metacritic': '85/100',
      'IMDb': '8.2/10',
      'Steam': '4.5/5',
      'OpenCritic': '82'
    };
  } catch (error) {
    console.error('Puanlama hatası:', error.message);
    return {};
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Game Intel Backend çalışıyor!' });
});

// Sunucu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎮 Game Intel sunucusu ${PORT} portunda çalışıyor`);
});