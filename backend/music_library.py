"""
Enhanced Music Library with 60 curated pleasant songs for wedding invitations.
Categorized by theme and mood with royalty-free demo tracks.

Categories:
- Devotional/Temple (12 songs)
- Classical/Traditional (12 songs)  
- Pleasant/Ambient (12 songs)
- Romantic/Soft (12 songs)
- Cinematic/Grand (12 songs)
"""
from typing import List, Dict, Optional
from fastapi import APIRouter

# Helper to build demo URLs (using various free music sources)
def _sh(n: int) -> str:
    """SoundHelix demo tracks"""
    return f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{n}.mp3"

def _demo(n: int) -> str:
    """Demo placeholder URL"""
    return f"https://cdn.pixabay.com/audio/2022/03/10/audio_{n:012d}.mp3"


MUSIC_LIBRARY = [
    # ═══════════════════════════════════════════════════════════
    # DEVOTIONAL / TEMPLE (12 songs)
    # ═══════════════════════════════════════════════════════════
    {"id": "dev-01", "title": "Ganpati Bappa Aarti", "category": "devotional", "mood": "sacred", "duration_sec": 192, "url": _sh(1)},
    {"id": "dev-02", "title": "Om Namo Bhagavate Mantra", "category": "devotional", "mood": "sacred", "duration_sec": 178, "url": _sh(2)},
    {"id": "dev-03", "title": "Krishna Bansuri Bhajan", "category": "devotional", "mood": "sacred", "duration_sec": 213, "url": _sh(3)},
    {"id": "dev-04", "title": "Mantra Meditation", "category": "devotional", "mood": "peaceful", "duration_sec": 165, "url": _sh(4)},
    {"id": "dev-05", "title": "Shiva Tandava Stotram", "category": "devotional", "mood": "sacred", "duration_sec": 201, "url": _sh(5)},
    {"id": "dev-06", "title": "Lakshmi Stotra", "category": "devotional", "mood": "sacred", "duration_sec": 189, "url": _sh(6)},
    {"id": "dev-07", "title": "Hanuman Chalisa Peaceful", "category": "devotional", "mood": "peaceful", "duration_sec": 224, "url": _sh(7)},
    {"id": "dev-08", "title": "Gayatri Mantra Chant", "category": "devotional", "mood": "sacred", "duration_sec": 176, "url": _sh(8)},
    {"id": "dev-09", "title": "Temple Bells & Conch", "category": "devotional", "mood": "sacred", "duration_sec": 198, "url": _sh(9)},
    {"id": "dev-10", "title": "Vedic Mantras Morning", "category": "devotional", "mood": "peaceful", "duration_sec": 205, "url": _sh(10)},
    {"id": "dev-11", "title": "Durga Stuti", "category": "devotional", "mood": "sacred", "duration_sec": 187, "url": _sh(11)},
    {"id": "dev-12", "title": "Saraswati Vandana", "category": "devotional", "mood": "peaceful", "duration_sec": 194, "url": _sh(12)},
    
    # ═══════════════════════════════════════════════════════════
    # CLASSICAL / TRADITIONAL (12 songs)
    # ═══════════════════════════════════════════════════════════
    {"id": "cls-01", "title": "Sitar Raga Yaman", "category": "classical", "mood": "elegant", "duration_sec": 224, "url": _sh(13)},
    {"id": "cls-02", "title": "Tabla & Bansuri Evening", "category": "classical", "mood": "traditional", "duration_sec": 198, "url": _sh(14)},
    {"id": "cls-03", "title": "Santoor Morning Raga", "category": "classical", "mood": "serene", "duration_sec": 246, "url": _sh(15)},
    {"id": "cls-04", "title": "Sarod & Sitar Duet", "category": "classical", "mood": "elegant", "duration_sec": 211, "url": _sh(16)},
    {"id": "cls-05", "title": "Veena Raga Bhairavi", "category": "classical", "mood": "traditional", "duration_sec": 233, "url": _sh(1)},
    {"id": "cls-06", "title": "Flute & Shehnai Fusion", "category": "classical", "mood": "festive", "duration_sec": 197, "url": _sh(2)},
    {"id": "cls-07", "title": "Mridangam Rhythms", "category": "classical", "mood": "energetic", "duration_sec": 185, "url": _sh(3)},
    {"id": "cls-08", "title": "Carnatic Violin Solo", "category": "classical", "mood": "elegant", "duration_sec": 219, "url": _sh(4)},
    {"id": "cls-09", "title": "Hindustani Thumri", "category": "classical", "mood": "romantic", "duration_sec": 208, "url": _sh(5)},
    {"id": "cls-10", "title": "Raag Darbari Kanada", "category": "classical", "mood": "majestic", "duration_sec": 241, "url": _sh(6)},
    {"id": "cls-11", "title": "Tabla Tarang Performance", "category": "classical", "mood": "traditional", "duration_sec": 192, "url": _sh(7)},
    {"id": "cls-12", "title": "Sitar & Tanpura Harmony", "category": "classical", "mood": "meditative", "duration_sec": 227, "url": _sh(8)},
    
    # ═══════════════════════════════════════════════════════════
    # PLEASANT / AMBIENT (12 songs)
    # ═══════════════════════════════════════════════════════════
    {"id": "ple-01", "title": "Pleasant Mehndi Morning", "category": "pleasant", "mood": "joyful", "duration_sec": 186, "url": _sh(9)},
    {"id": "ple-02", "title": "Soft Indian Strings", "category": "pleasant", "mood": "calm", "duration_sec": 167, "url": _sh(10)},
    {"id": "ple-03", "title": "Lounge Bansuri Breeze", "category": "pleasant", "mood": "relaxed", "duration_sec": 203, "url": _sh(11)},
    {"id": "ple-04", "title": "Tranquil Mandap", "category": "pleasant", "mood": "peaceful", "duration_sec": 175, "url": _sh(12)},
    {"id": "ple-05", "title": "Garden Wedding Ambience", "category": "pleasant", "mood": "fresh", "duration_sec": 199, "url": _sh(13)},
    {"id": "ple-06", "title": "Sunshine Haldi Vibes", "category": "pleasant", "mood": "cheerful", "duration_sec": 182, "url": _sh(14)},
    {"id": "ple-07", "title": "Soft Acoustic Strings", "category": "pleasant", "mood": "warm", "duration_sec": 214, "url": _sh(15)},
    {"id": "ple-08", "title": "Morning Raga Light", "category": "pleasant", "mood": "serene", "duration_sec": 188, "url": _sh(16)},
    {"id": "ple-09", "title": "Peaceful Pavilion", "category": "pleasant", "mood": "calm", "duration_sec": 196, "url": _sh(1)},
    {"id": "ple-10", "title": "Gentle Celebration", "category": "pleasant", "mood": "joyful", "duration_sec": 209, "url": _sh(2)},
    {"id": "ple-11", "title": "Breezy Sangeet Setup", "category": "pleasant", "mood": "light", "duration_sec": 177, "url": _sh(3)},
    {"id": "ple-12", "title": "Elegant Garden Party", "category": "pleasant", "mood": "sophisticated", "duration_sec": 221, "url": _sh(4)},
    
    # ═══════════════════════════════════════════════════════════
    # ROMANTIC / SOFT (12 songs)
    # ═══════════════════════════════════════════════════════════
    {"id": "rom-01", "title": "Love in Lucknow", "category": "romantic", "mood": "tender", "duration_sec": 174, "url": _sh(5)},
    {"id": "rom-02", "title": "Soft Sufi Whispers", "category": "romantic", "mood": "intimate", "duration_sec": 207, "url": _sh(6)},
    {"id": "rom-03", "title": "Wedding Soiree Dreams", "category": "romantic", "mood": "dreamy", "duration_sec": 188, "url": _sh(7)},
    {"id": "rom-04", "title": "Moonlight Pheras", "category": "romantic", "mood": "magical", "duration_sec": 193, "url": _sh(8)},
    {"id": "rom-05", "title": "Hearts Entwined", "category": "romantic", "mood": "loving", "duration_sec": 216, "url": _sh(9)},
    {"id": "rom-06", "title": "Gentle Love Story", "category": "romantic", "mood": "sweet", "duration_sec": 179, "url": _sh(10)},
    {"id": "rom-07", "title": "Romantic Mandap Moments", "category": "romantic", "mood": "tender", "duration_sec": 201, "url": _sh(11)},
    {"id": "rom-08", "title": "Eternal Promise", "category": "romantic", "mood": "emotional", "duration_sec": 195, "url": _sh(12)},
    {"id": "rom-09", "title": "Soft Bridal Entry", "category": "romantic", "mood": "graceful", "duration_sec": 184, "url": _sh(13)},
    {"id": "rom-10", "title": "Love Letters Melody", "category": "romantic", "mood": "nostalgic", "duration_sec": 212, "url": _sh(14)},
    {"id": "rom-11", "title": "First Dance Waltz", "category": "romantic", "mood": "elegant", "duration_sec": 189, "url": _sh(15)},
    {"id": "rom-12", "title": "Sunset Couple Portrait", "category": "romantic", "mood": "warm", "duration_sec": 198, "url": _sh(16)},
    
    # ═══════════════════════════════════════════════════════════
    # CINEMATIC / GRAND (12 songs)
    # ═══════════════════════════════════════════════════════════
    {"id": "cin-01", "title": "Royal Procession March", "category": "cinematic", "mood": "majestic", "duration_sec": 156, "url": _sh(1)},
    {"id": "cin-02", "title": "Baraat Drums & Shehnai", "category": "cinematic", "mood": "celebratory", "duration_sec": 182, "url": _sh(2)},
    {"id": "cin-03", "title": "Cinematic Phera Theme", "category": "cinematic", "mood": "epic", "duration_sec": 218, "url": _sh(3)},
    {"id": "cin-04", "title": "Sunset Sangeet Spectacular", "category": "cinematic", "mood": "grand", "duration_sec": 195, "url": _sh(4)},
    {"id": "cin-05", "title": "Palace Wedding Grandeur", "category": "cinematic", "mood": "royal", "duration_sec": 229, "url": _sh(5)},
    {"id": "cin-06", "title": "Epic Bride Entry", "category": "cinematic", "mood": "dramatic", "duration_sec": 203, "url": _sh(6)},
    {"id": "cin-07", "title": "Majestic Reception Entrance", "category": "cinematic", "mood": "powerful", "duration_sec": 191, "url": _sh(7)},
    {"id": "cin-08", "title": "Grand Mandap Reveal", "category": "cinematic", "mood": "spectacular", "duration_sec": 215, "url": _sh(8)},
    {"id": "cin-09", "title": "Fireworks Finale", "category": "cinematic", "mood": "triumphant", "duration_sec": 187, "url": _sh(9)},
    {"id": "cin-10", "title": "Regal Couple Introduction", "category": "cinematic", "mood": "majestic", "duration_sec": 208, "url": _sh(10)},
    {"id": "cin-11", "title": "Victory Celebration Theme", "category": "cinematic", "mood": "jubilant", "duration_sec": 196, "url": _sh(11)},
    {"id": "cin-12", "title": "Epic Love Saga", "category": "cinematic", "mood": "legendary", "duration_sec": 234, "url": _sh(12)},
]


def get_all_music() -> List[Dict]:
    """Get all 60 songs"""
    return MUSIC_LIBRARY


def get_music_by_category(category: str) -> List[Dict]:
    """Get songs filtered by category"""
    return [song for song in MUSIC_LIBRARY if song["category"] == category]


def get_music_by_mood(mood: str) -> List[Dict]:
    """Get songs filtered by mood"""
    return [song for song in MUSIC_LIBRARY if song["mood"] == mood]


def get_categories() -> List[str]:
    """Get unique categories"""
    return list(set(song["category"] for song in MUSIC_LIBRARY))


def get_moods() -> List[str]:
    """Get unique moods"""
    return list(set(song["mood"] for song in MUSIC_LIBRARY))


def build_music_library_router() -> APIRouter:
    """Build FastAPI router for music library endpoints"""
    router = APIRouter(tags=["music_library"], prefix="/api/music")
    
    @router.get("/library")
    async def get_music_library(
        category: Optional[str] = None,
        mood: Optional[str] = None
    ):
        """Get music library with optional filtering"""
        if category:
            songs = get_music_by_category(category)
        elif mood:
            songs = get_music_by_mood(mood)
        else:
            songs = get_all_music()
        
        return {
            "songs": songs,
            "count": len(songs),
            "categories": get_categories(),
            "moods": get_moods()
        }
    
    @router.get("/categories")
    async def list_categories():
        """Get list of available categories"""
        return {
            "categories": get_categories()
        }
    
    @router.get("/moods")
    async def list_moods():
        """Get list of available moods"""
        return {
            "moods": get_moods()
        }

    @router.get("/presets")
    async def get_presets(category: Optional[str] = None, mood: Optional[str] = None):
        """Returns presets in the shape the frontend MusicPresetPicker expects.
        The picker uses `mood` to filter — for backwards compat, the song's
        category (devotional / classical / pleasant / cinematic / romantic) is
        exposed as `mood` here so the existing filters keep working."""
        if category:
            songs = get_music_by_category(category)
        elif mood and mood != 'all':
            # frontend MOODS list = category list — try category first, then mood
            songs = get_music_by_category(mood) or get_music_by_mood(mood)
        else:
            songs = get_all_music()
        presets = []
        for s in songs:
            presets.append({
                "id": s["id"],
                "title": s["title"],
                "mood": s["category"],  # expose category as mood label
                "duration_sec": s["duration_sec"],
                "url": s["url"],
            })
        return {"presets": presets, "count": len(presets)}

    return router
