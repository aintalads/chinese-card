import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, 
  Layers, 
  RotateCcw, 
  Settings, 
  ThumbsDown, 
  ThumbsUp, 
  Volume2, 
  Sparkles, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Sliders, 
  Award, 
  Flame, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

// --- Vocabulary Deck Definition ---
interface Flashcard {
  id: number;
  char: string;
  pinyin: string;
  english: string;
  example: string;
  level: string;
  category?: string;
}

// Helper to parse example sentence into Chinese, Pinyin, and English translation
function parseExample(exampleStr: string) {
  const pinyinMatch = exampleStr.match(/\(([^)]+)\)/);
  const pinyin = pinyinMatch ? pinyinMatch[1] : '';
  
  let chinese = exampleStr;
  if (pinyinMatch && pinyinMatch.index !== undefined) {
    chinese = exampleStr.substring(0, pinyinMatch.index).trim();
  } else {
    const dashIdx = exampleStr.indexOf('—') !== -1 ? exampleStr.indexOf('—') : exampleStr.indexOf('-');
    if (dashIdx !== -1) chinese = exampleStr.substring(0, dashIdx).trim();
  }
  
  let english = '';
  const dashIdx = exampleStr.indexOf('—') !== -1 ? exampleStr.indexOf('—') : exampleStr.indexOf('-');
  if (dashIdx !== -1) {
    english = exampleStr.substring(dashIdx + 1).trim();
  } else if (pinyinMatch && pinyinMatch.index !== undefined) {
    english = exampleStr.substring(pinyinMatch.index + pinyinMatch[0].length).replace(/^[-—/\s]+/, '').trim();
  }
  
  return {
    chinese: chinese || exampleStr,
    pinyin: pinyin,
    english: english
  };
}

// Generate 69 authentic Mandarin vocabulary cards (starting with '人' as requested in prompt)
const INITIAL_CARDS: Flashcard[] = [
  { id: 1, char: "人", pinyin: "rén", english: "person; human; mankind", example: "他是個好人。(Tā shì gè hǎo rén.) — He is a good person.", level: "TOCFL A1 / HSK 1", category: "Core Noun" },
  { id: 2, char: "水", pinyin: "shuǐ", english: "water; river; liquid", example: "請給我一杯熱水。(Qǐng gěi wǒ yì bēi rè shuǐ.) — Please give me a glass of hot water.", level: "TOCFL A1 / HSK 1", category: "Nature" },
  { id: 3, char: "火", pinyin: "huǒ", english: "fire; flame; urgent", example: "小心火燭。(Xiǎoxīn huǒzhú.) — Be careful with fire.", level: "TOCFL A1 / HSK 1", category: "Nature" },
  { id: 4, char: "木", pinyin: "mù", english: "tree; wood; timber", example: "這是木頭做的。(Zhè shì mùtou zuò de.) — This is made of wood.", level: "TOCFL A1 / HSK 1", category: "Nature" },
  { id: 5, char: "天", pinyin: "tiān", english: "sky; day; heaven", example: "今天天氣很好。(Jīntiān tiānqì hěn hǎo.) — The weather is very nice today.", level: "TOCFL A1 / HSK 1", category: "Nature / Time" },
  { id: 6, char: "大", pinyin: "dà", english: "big; large; great", example: "這個蘋果很大。(Zhège píngguǒ hěn dà.) — This apple is big.", level: "TOCFL A1 / HSK 1", category: "Adjective" },
  { id: 7, char: "中", pinyin: "zhōng", english: "middle; center; China", example: "我在學中文。(Wǒ zài xué Zhōngwén.) — I am studying Chinese.", level: "TOCFL A1 / HSK 1", category: "Location / Culture" },
  { id: 8, char: "小", pinyin: "xiǎo", english: "small; little; young", example: "那隻小貓真可愛。(Nà zhī xiǎo māo zhēn kě'ài.) — That little cat is so cute.", level: "TOCFL A1 / HSK 1", category: "Adjective" },
  { id: 9, char: "日", pinyin: "rì", english: "sun; day; date", example: "今天是星期日。(Jīntiān shì Xīngqírì.) — Today is Sunday.", level: "TOCFL A1 / HSK 1", category: "Time / Nature" },
  { id: 10, char: "月", pinyin: "yuè", english: "moon; month", example: "八月十五是中秋節。(Bā yuè shíwǔ shì Zhōngqiūjié.) — August 15th is the Mid-Autumn Festival.", level: "TOCFL A1 / HSK 1", category: "Time / Nature" },
  { id: 11, char: "書", pinyin: "shū", english: "book; document; letter", example: "我喜歡看書。(Wǒ xǐhuān kàn shū.) — I like reading books.", level: "TOCFL A1 / HSK 1", category: "Study / Education" },
  { id: 12, char: "家", pinyin: "jiā", english: "home; family; house", example: "我愛我的家。(Wǒ ài wǒ de jiā.) — I love my home/family.", level: "TOCFL A1 / HSK 1", category: "Society" },
  { id: 13, char: "學", pinyin: "xué", english: "to study; to learn; school", example: "學習是一件快樂的事。(Xuéxí shì yí jiàn kuàilè de shì.) — Learning is a joyful thing.", level: "TOCFL A1 / HSK 1", category: "Study / Verb" },
  { id: 14, char: "愛", pinyin: "ài", english: "to love; affection; passion", example: "我愛吃台灣小吃。(Wǒ ài chī Táiwān xiǎochī.) — I love eating Taiwan snacks.", level: "TOCFL A1 / HSK 1", category: "Emotion" },
  { id: 15, char: "國", pinyin: "guó", english: "country; nation; state", example: "你打算出國嗎？(Nǐ dǎsuàn chūguó ma?) — Are you planning to go abroad?", level: "TOCFL A1 / HSK 1", category: "Society" },
];

// Fill up to exactly 69 cards for authentic TOCFL Band A/B practice
const EXTRA_VOCAB = [
  { c: "年", p: "nián", e: "year; age", ex: "新年快樂！(Xīnnián kuàilè!) — Happy New Year!" },
  { c: "時", p: "shí", e: "time; hour; period", ex: "時間不早了。(Shíjiān bù zǎo le.) — It is getting late." },
  { c: "道", p: "dào", e: "road; path; way; to speak", ex: "我知道了。(Wǒ zhīdào le.) — I got it / I know." },
  { c: "說", p: "shuō", e: "to speak; to say; to explain", ex: "請再說一次。(Qǐng zài shuō yícì.) — Please say that again." },
  { c: "行", p: "xíng", e: "capable; capable; to walk; OK", ex: "這樣行嗎？(Zhèyàng xíng ma?) — Is it OK this way?" },
  { c: "高", p: "gāo", e: "high; tall; elevated", ex: "很高興認識你。(Hěn gāoxìng rènshì nǐ.) — Nice to meet you." },
  { c: "新", p: "xīn", e: "new; fresh; recent", ex: "這是我的新朋友。(Zhè shì wǒ de xīn péngyǒu.) — This is my new friend." },
  { c: "長", p: "cháng", e: "long; length; forever", ex: "這條路很長。(Zhè tiáo lù hěn cháng.) — This road is very long." },
  { c: "心", p: "xīn", e: "heart; mind; intention", ex: "謝謝你的心意。(Xièxiè nǐ de xīnyì.) — Thank you for your kindness." },
  { c: "眼", p: "yǎn", e: "eye; look; glance", ex: "他的眼睛真漂亮。(Tā de yǎnjīng zhēn piàoliang.) — His eyes are really pretty." },
  { c: "山", p: "shān", e: "mountain; hill", ex: "周末我們去爬山。(Zhōumò wǒmen qù páshān.) — We are going hiking this weekend." },
  { c: "風", p: "fēng", e: "wind; breeze; style", ex: "外面的風很大。(Wàimiàn de fēng hěn dà.) — The wind outside is very strong." },
  { c: "雨", p: "yǔ", e: "rain; rainy weather", ex: "開始下雨了。(Kāishǐ xiàyǔ le.) — It has started to rain." },
  { c: "門", p: "mén", e: "door; gate; entrance", ex: "請隨手關門。(Qǐng suíshǒu guānmén.) — Please close the door." },
  { c: "手", p: "shǒu", e: "hand; skill; person", ex: "請洗手。(Qǐng xǐshǒu.) — Please wash your hands." },
  { c: "口", p: "kǒu", e: "mouth; opening; entrance", ex: "你家有幾口人？(Nǐ jiā yǒu jǐ kǒu rén?) — How many people are in your family?" },
  { c: "走", p: "zǒu", e: "to walk; to leave; to go", ex: "我們一起走吧。(Wǒmen yìqǐ zǒu ba.) — Let's go together." },
  { c: "見", p: "jiàn", e: "to see; to meet; to appear", ex: "明天見！(Míngtiān jiàn!) — See you tomorrow!" },
  { c: "聽", p: "tīng", e: "to listen; to hear; to obey", ex: "你聽見了嗎？(Nǐ tīngjiàn le ma?) — Did you hear that?" },
  { c: "買", p: "mǎi", e: "to buy; to purchase", ex: "我想買這個。(Wǒ xiǎng mǎi zhège.) — I want to buy this." },
  { c: "吃", p: "chī", e: "to eat; to consume", ex: "你吃飯了嗎？(Nǐ chīfàn le ma?) — Have you eaten yet?" },
  { c: "喝", p: "hē", e: "to drink", ex: "多喝茶對身體好。(Duō hē chá duì shēntǐ hǎo.) — Drinking more tea is good for health." },
  { c: "寫", p: "xiě", e: "to write; to compose", ex: "中文字不好寫。(Zhōngwén zì bù hǎo xiě.) — Chinese characters are not easy to write." },
  { c: "坐", p: "zuò", e: "to sit; to take (transport)", ex: "請坐！(Qǐng zuò!) — Please sit down!" },
  { c: "開", p: "kāi", e: "to open; to start; to drive", ex: "他在開車。(Tā zài kāichē.) — He is driving." },
  { c: "問", p: "wèn", e: "to ask; to inquire", ex: "請問廁所在哪裡？(Qǐngwèn cèsuǒ zài nǎlǐ?) — Excuse me, where is the restroom?" },
  { c: "笑", p: "xiào", e: "to smile; to laugh", ex: "他總是愛笑。(Tā zǒngshì ài xiào.) — He always loves to smile." },
  { c: "紅", p: "hóng", e: "red; popular; revolutionary", ex: "她穿著一件紅洋裝。(Tā chuānzhe yí jiàn hóng yángzhuāng.) — She is wearing a red dress." },
  { c: "白", p: "bái", e: "white; pure; plain", ex: "今天有白雲。(Jīntiān yǒu báiyún.) — There are white clouds today." },
  { c: "黑", p: "hēi", e: "black; dark", ex: "天黑了。(Tiān hēi le.) — It has gotten dark." },
  { c: "早", p: "zǎo", e: "early; morning; soon", ex: "早上好！(Zǎoshang hǎo!) — Good morning!" },
  { c: "晚", p: "wǎn", e: "evening; late; night", ex: "晚安！(Wǎn'ān!) — Good night!" },
  { c: "快", p: "kuài", e: "fast; quick; rapid; soon", ex: "快一點！(Kuài yìdiǎn!) — Hurry up!" },
  { c: "慢", p: "màn", e: "slow; sluggish", ex: "請說慢一點。(Qǐng shuō màn yìdiǎn.) — Please speak a little slower." },
  { c: "遠", p: "yuǎn", e: "far; distant; remote", ex: "學校離這裡很遠。(Xuéxiào lí zhèlǐ hěn yuǎn.) — The school is far from here." },
  { c: "近", p: "jìn", e: "near; close; approaching", ex: "我家離捷運站很近。(Wǒ jiā lí jiéyùn zhàn hěn jìn.) — My house is very close to the MRT station." },
  { c: "男", p: "nán", e: "male; man; son", ex: "他是一個帥氣的男生。(Tā shì yí gè shuàiqì de nánshēng.) — He is a handsome boy." },
  { c: "女", p: "nǚ", e: "female; woman; daughter", ex: "她是我們學校的女孩。(Tā shì wǒmen xuéxiào de nǚhái.) — She is a girl from our school." },
  { c: "老", p: "lǎo", e: "old; aged; venerable", ex: "王老師很人慈。(Wáng lǎoshī hěn réncí.) — Teacher Wang is very kind." },
  { c: "少", p: "shǎo", e: "few; little; lack", ex: "少吃冰的。(Shǎo chī bīng de.) — Eat less ice." },
  { c: "多", p: "duō", e: "many; much; numerous", ex: "這裡人很多。(Zhèlǐ rén hěn duō.) — There are many people here." },
  { c: "好", p: "hǎo", e: "good; well; fine", ex: "你好嗎？(Nǐ hǎo ma?) — How are you?" },
  { c: "美", p: "měi", e: "beautiful; pretty; USA", ex: "台灣風景真美。(Táiwān fēngjǐng zhēn měi.) — Taiwan's scenery is truly beautiful." },
  { c: "香", p: "xiāng", e: "fragrant; sweet-smelling; savory", ex: "這杯咖啡真香。(Zhè bēi kāfēi zhēn xiāng.) — This coffee smells so fragrant." },
  { c: "甜", p: "tián", e: "sweet; honeyed", ex: "西瓜很甜。(Xīguā hěn tián.) — Watermelon is very sweet." },
  { c: "苦", p: "kǔ", e: "bitter; hardship; pain", ex: "良藥苦口。(Liángyào kǔ kǒu.) — Good medicine tastes bitter." },
  { c: "冷", p: "lěng", e: "cold; chilly", ex: "今天台北很冷。(Jīntiān Táiběi hěn lěng.) — Taipei is very cold today." },
  { c: "熱", p: "rè", e: "hot; warm; enthusiastic", ex: "天氣太熱了！(Tiānqì tài rè le!) — The weather is too hot!" },
  { c: "光", p: "guāng", e: "light; ray; glory; only", ex: "陽光很充足。(Yángguāng hěn chōngzú.) — The sunlight is abundant." },
  { c: "車", p: "chē", e: "vehicle; car; machine", ex: "我們坐火車去花蓮。(Wǒmen zuò huǒchē qù Huālián.) — We are taking a train to Hualien." },
  { c: "船", p: "chuán", e: "boat; ship; vessel", ex: "海上有好多艘船。(Hǎishàng yǒu hǎoduō sōu chuán.) — There are many ships on the sea." },
  { c: "花", p: "huā", e: "flower; blossom; to spend", ex: "公園裡開滿了花。(Gōngyuán lǐ kāimǎn le huā.) — The park is full of blooming flowers." },
  { c: "草", p: "cǎo", e: "grass; straw; herbs", ex: "綠草如茵。(Lù cǎo rú yīn.) — The green grass looks like a carpet." },
  { c: "茶", p: "chá", e: "tea; tea leaves", ex: "要不要喝杯烏龍茶？(Yào bú yào hē bēi Wūlóngchá?) — Would you like a cup of Oolong tea?" },
];

while (INITIAL_CARDS.length < 69) {
  const idx = INITIAL_CARDS.length - 15;
  const item = EXTRA_VOCAB[idx % EXTRA_VOCAB.length];
  INITIAL_CARDS.push({
    id: INITIAL_CARDS.length + 1,
    char: item.c,
    pinyin: item.p,
    english: item.e,
    example: item.ex,
    level: "TOCFL Band A",
    category: "Vocabulary"
  });
}

export default function App() {
  // --- Navigation & Header State ---
  const [activeTab, setActiveTab] = useState<'books' | 'mode' | 'review' | 'stats'>('mode');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // --- Flashcard Deck State ---
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const [currentIndex, setCurrentIndex] = useState<number>(0); // 0-indexed (card 1 of 69)
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // --- Progress & SRS Badges ---
  const [thumbsDownCount, setThumbsDownCount] = useState<number>(0);
  const [thumbsUpCount, setThumbsUpCount] = useState<number>(0);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);

  // --- Audio & Settings ---
  const [ttsSpeed, setTtsSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showPinyinHint, setShowPinyinHint] = useState<boolean>(false);
  const [accentColor, setAccentColor] = useState<'indigo' | 'cyan' | 'emerald' | 'rose'>('indigo');
  const [selectedDeckName, setSelectedDeckName] = useState<string>("TOCFL Band A (Core 69)");

  const currentCard = cards[currentIndex] || cards[0];
  const progressPercentage = Math.round(((currentIndex + 1) / cards.length) * 100);

  // --- Audio Pronunciation Engine ---
  const playAudio = useCallback((text: string, lang = 'zh-TW') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = ttsSpeed === 'slow' ? 0.6 : ttsSpeed === 'fast' ? 1.25 : 0.95;
        
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => 
          (v.lang.includes('zh-TW') || v.lang.includes('zh-HK') || v.lang.includes('zh-CN')) &&
          (v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.toLowerCase().includes('zh'));
        
        if (zhVoice) {
          utterance.voice = zhVoice;
        }
        window.speechSynthesis.speak(utterance);
      }, 30);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }, [ttsSpeed]);

  // Auto-play audio when card flips or changes (if setting enabled)
  useEffect(() => {
    if (autoPlayAudio && activeTab === 'mode') {
      playAudio(currentCard.char, 'zh-TW');
    }
  }, [currentIndex, activeTab]);

  // --- Handlers ---
  const handleFlip = () => {
    const nextFlippedState = !isFlipped;
    setIsFlipped(nextFlippedState);
    if (nextFlippedState && autoPlayAudio) {
      playAudio(currentCard.char, 'zh-TW');
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back or show completion
      setCurrentIndex(0);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRating = (rating: 'down' | 'up') => {
    if (rating === 'down') {
      setThumbsDownCount(prev => prev + 1);
      if (!reviewQueue.includes(currentCard.id)) {
        setReviewQueue(prev => [...prev, currentCard.id]);
      }
    } else {
      setThumbsUpCount(prev => prev + 1);
      if (!masteredIds.includes(currentCard.id)) {
        setMasteredIds(prev => [...prev, currentCard.id]);
      }
      // Remove from review queue if they mastered it now
      setReviewQueue(prev => prev.filter(id => id !== currentCard.id));
    }
    // Automatically advance to next card after evaluation
    handleNextCard();
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setThumbsDownCount(0);
    setThumbsUpCount(0);
    setReviewQueue([]);
    setMasteredIds([]);
  };

  // --- Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or modal open
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (!isFlipped) {
          handleFlip();
        } else {
          handleNextCard();
        }
      } else if (e.code === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleRating('up');
      } else if (e.code === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleRating('down');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        playAudio(currentCard.char, 'zh-TW');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, currentCard, playAudio]);

  // --- Color Theme Mapping ---
  const accentConfigs = {
    indigo: {
      btnBg: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-500/30 border-indigo-400/30 text-indigo-200',
      tabActive: 'border-indigo-500 text-white',
      progressFill: 'from-blue-500 via-indigo-500 to-purple-500',
      badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
      cardBorder: 'hover:border-indigo-500/40 focus:border-indigo-500',
      glow: 'shadow-indigo-950/50'
    },
    cyan: {
      btnBg: 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 shadow-cyan-500/30 border-cyan-400/30 text-cyan-200',
      tabActive: 'border-cyan-400 text-white',
      progressFill: 'from-cyan-400 via-teal-500 to-blue-500',
      badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      cardBorder: 'hover:border-cyan-500/40 focus:border-cyan-500',
      glow: 'shadow-cyan-950/50'
    },
    emerald: {
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-500/30 border-emerald-400/30 text-emerald-200',
      tabActive: 'border-emerald-500 text-white',
      progressFill: 'from-emerald-400 via-green-500 to-teal-500',
      badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
      cardBorder: 'hover:border-emerald-500/40 focus:border-emerald-500',
      glow: 'shadow-emerald-950/50'
    },
    rose: {
      btnBg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-500/30 border-rose-400/30 text-rose-200',
      tabActive: 'border-rose-500 text-white',
      progressFill: 'from-rose-500 via-pink-500 to-purple-500',
      badge: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      cardBorder: 'hover:border-rose-500/40 focus:border-rose-500',
      glow: 'shadow-rose-950/50'
    }
  };

  const theme = accentConfigs[accentColor];

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* --- TOP HEADER BAR --- */}
      <header className="sticky top-0 z-40 w-full bg-[#0B132B]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between">
          
          {/* Left: App Logo / Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('mode')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-bold text-lg tracking-wider">
              學
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base md:text-lg flex items-center gap-1.5">
                Alads <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 font-mono">TOCFL C1</span>
              </span>
            </div>
          </div>

          {/* Center: Segmented Navigation Control / Tabs */}
          <nav aria-label="Main Navigation" className="flex items-center space-x-1 sm:space-x-4">
            {(['books', 'mode', 'review', 'stats'] as const).map((tabName) => {
              const isActive = activeTab === tabName;
              const labels = {
                books: 'Books',
                mode: 'Mode',
                review: 'Review',
                stats: 'Stats'
              };
              const icons = {
                books: <BookOpen className="w-4 h-4" />,
                mode: <Layers className="w-4 h-4" />,
                review: <RotateCcw className="w-4 h-4" />,
                stats: <BarChart3 className="w-4 h-4" />
              };

              return (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName)}
                  className={`relative px-3 sm:px-5 py-3 flex items-center gap-2 text-sm md:text-base font-medium transition-all duration-200 outline-none ${
                    isActive 
                      ? 'text-white font-semibold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {icons[tabName]}
                  <span>{labels[tabName]}</span>
                  
                  {/* Visual Indicator for Active State (Underline under Mode) */}
                  {isActive && (
                    <span 
                      className={`absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-gradient-to-r ${theme.progressFill} shadow-sm`}
                      aria-hidden="true"
                    />
                  )}
                  
                  {/* Count indicator for review tab */}
                  {tabName === 'review' && reviewQueue.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      {reviewQueue.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Far Right: Settings Gear Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Settings"
              title="Preferences & Audio Settings"
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                showSettings 
                  ? 'bg-slate-800 text-white border-slate-600 shadow-inner' 
                  : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Settings className={`w-4 h-4 transition-transform duration-500 ${showSettings ? 'rotate-90 text-indigo-400' : ''}`} />
            </button>
          </div>

        </div>
      </header>

      {/* --- SETTINGS CENTERED MODAL OVERLAY --- */}
      {showSettings && (
        <div 
          onClick={() => setShowSettings(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-[#16203B] border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Study Preferences
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-sm">
              {/* Pronunciation Speed */}
              <div>
                <label className="block text-slate-300 font-medium mb-2 flex items-center justify-between">
                  <span>Audio Pronunciation Speed</span>
                  <span className="text-xs text-indigo-400 font-mono uppercase">{ttsSpeed}</span>
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                  {(['slow', 'normal', 'fast'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => setTtsSpeed(speed)}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        ttsSpeed === speed 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Auto-Play Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-slate-200 font-medium">Auto-play Mandarin Voice</div>
                  <div className="text-xs text-slate-400">Speak character automatically when flipping</div>
                </div>
                <button
                  onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${autoPlayAudio ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoPlayAudio ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Always Show Pinyin Hint Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-slate-200 font-medium">Show Pinyin Before Flip</div>
                  <div className="text-xs text-slate-400">Display phonetic reading above character</div>
                </div>
                <button
                  onClick={() => setShowPinyinHint(!showPinyinHint)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${showPinyinHint ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showPinyinHint ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Theme Accent Picker */}
              <div>
                <label className="block text-slate-300 font-medium mb-2">Accent Theme Color</label>
                <div className="flex items-center gap-3">
                  {(['indigo', 'cyan', 'emerald', 'rose'] as const).map(color => {
                    const bgColors = {
                      indigo: 'bg-indigo-500',
                      cyan: 'bg-cyan-500',
                      emerald: 'bg-emerald-500',
                      rose: 'bg-rose-500'
                    };
                    return (
                      <button
                        key={color}
                        onClick={() => setAccentColor(color)}
                        className={`w-8 h-8 rounded-full ${bgColors[color]} flex items-center justify-center transition-transform ${
                          accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#16203B] scale-110' : 'opacity-60 hover:opacity-100'
                        }`}
                        title={`${color} accent`}
                      >
                        {accentColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Session Action */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    resetSession();
                    setShowSettings(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Deck Progress & Counts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT VIEWPORT (CENTERED BOTH VERTICALLY & HORIZONTALLY) --- */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full my-auto">
        
        {/* VIEW 1: BOOKS TAB */}
        {activeTab === 'books' && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vocabulary Study Decks</h1>
              <p className="text-slate-400 text-sm">Select a curriculum book or frequency list to load into your flashcard workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                { name: "TOCFL Band A (Core 69)", desc: "High-frequency everyday words for novice/intermediate fluency.", count: "69 cards", active: selectedDeckName === "TOCFL Band A (Core 69)" },
                { name: "TOCFL Band B (Advanced)", desc: "Formal expressions, journalism, and academic idioms.", count: "120 cards", active: selectedDeckName === "TOCFL Band B (Advanced)" },
                { name: "HSK 1 - 3 Core Vocabulary", desc: "Essential simplified and traditional characters for mainland test prep.", count: "300 cards", active: selectedDeckName === "HSK 1 - 3 Core Vocabulary" },
                { name: "Taiwanese Daily Survival", desc: "Night market snacks, MRT navigation, and casual slang.", count: "85 cards", active: selectedDeckName === "Taiwanese Daily Survival" },
              ].map((deck, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDeckName(deck.name);
                    resetSession();
                    setActiveTab('mode');
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    deck.active
                      ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'bg-[#16203B]/60 border-slate-800 hover:border-slate-700 hover:bg-[#1C284A]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono bg-slate-800/80 border border-slate-700 text-slate-300">
                        {deck.count}
                      </span>
                      {deck.active && (
                        <span className="text-xs text-indigo-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Selected
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{deck.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{deck.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <span className="text-xs font-semibold text-indigo-400 group-hover:underline flex items-center gap-1">
                      Load Deck <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: REVIEW TAB */}
        {activeTab === 'review' && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-6 h-6 text-rose-400" />
                  Spaced Repetition Review Queue
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Words marked as "Need Review" (thumbs down) accumulate here for reinforcement.
                </p>
              </div>
              <button
                onClick={() => setReviewQueue([])}
                disabled={reviewQueue.length === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium disabled:opacity-40 transition-colors"
              >
                Clear Queue
              </button>
            </div>

            {reviewQueue.length === 0 ? (
              <div className="py-16 text-center bg-[#16203B]/40 rounded-3xl border border-slate-800/80 p-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Your Review Queue is Empty!</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                  You haven't marked any words as difficult yet. Jump into "Mode" to start studying flashcards.
                </p>
                <button
                  onClick={() => setActiveTab('mode')}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Start Studying Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {cards.filter(c => reviewQueue.includes(c.id)).map(card => (
                  <div
                    key={card.id}
                    className="p-4 rounded-2xl bg-[#16203B] border border-slate-700/60 flex items-center justify-between group hover:border-indigo-500/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-2xl font-bold text-white">
                        {card.char}
                      </div>
                      <div>
                        <div className="font-bold text-white text-base flex items-center gap-2">
                          {card.pinyin}
                          <button 
                            onClick={() => playAudio(card.char, 'zh-TW')}
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">{card.english}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Jump directly to this card in Mode
                        const idx = cards.findIndex(c => c.id === card.id);
                        if (idx !== -1) setCurrentIndex(idx);
                        setActiveTab('mode');
                        setIsFlipped(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-all"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: STATS TAB */}
        {activeTab === 'stats' && (
          <div className="w-full max-w-3xl space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-1 mb-2">
              <h1 className="text-2xl font-bold text-white">Study Analytics & Progress</h1>
              <p className="text-xs text-slate-400">Track your vocabulary retention and daily streaks.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#16203B] border border-slate-800 text-center">
                <Flame className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-extrabold text-white">7 Days</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Current Streak</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#16203B] border border-slate-800 text-center">
                <Award className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <div className="text-2xl font-extrabold text-white">{masteredIds.length}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">Mastered Words</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#16203B] border border-slate-800 text-center">
                <RotateCcw className="w-6 h-6 text-rose-400 mx-auto mb-2" />
                <div className="text-2xl font-extrabold text-white">{reviewQueue.length}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">In Review Queue</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#16203B] border border-slate-800 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-extrabold text-white">
                  {thumbsUpCount + thumbsDownCount > 0 
                    ? `${Math.round((thumbsUpCount / (thumbsUpCount + thumbsDownCount)) * 100)}%` 
                    : '100%'}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">Retention Rate</div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#16203B] border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm">Active Curriculum Deck Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Current Deck</span>
                  <span className="text-white font-semibold">{selectedDeckName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Total Cards in Deck</span>
                  <span className="text-white font-mono font-semibold">{cards.length} cards</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">Current Position</span>
                  <span className="text-indigo-400 font-mono font-semibold">Card #{currentIndex + 1}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Audio Voice Standard</span>
                  <span className="text-slate-200 font-semibold">Mandarin (Traditional / Standard)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MODE TAB (THE PRIMARY FLASHCARD STUDY WORKSPACE) */}
        {activeTab === 'mode' && (
          <div className="w-full max-w-xl flex flex-col items-center space-y-6 animate-in fade-in duration-300">
            
            {/* --- STATUS & PROGRESS AREA (Grouped clearly above flashcard) --- */}
            <div className="w-full flex items-center justify-between gap-3 px-1">
              
              {/* Red badge (Unknown / Missed count) - NO emoji, just the red styling and number */}
              <div 
                title="Needs Review / Missed"
                className="flex items-center justify-center px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold shadow-sm min-w-[32px] h-7 shrink-0"
              >
                <span className="font-mono">{thumbsDownCount}</span>
              </div>

              {/* Left/Middle: Prominent Progress Bar */}
              <div className="flex-1 h-3 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${theme.progressFill} transition-all duration-300 ease-out shadow-sm`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Card Counter */}
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-200 font-mono font-semibold shadow-sm shrink-0">
                {currentIndex + 1}/{cards.length}
              </span>

              {/* Green badge (Mastered / Correct count) - NO emoji, just the green styling and number */}
              <div 
                title="Mastered / Correct"
                className="flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm min-w-[32px] h-7 shrink-0"
              >
                <span className="font-mono">{thumbsUpCount}</span>
              </div>

              {/* Settings Icon beside progress bar / badges */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Settings"
                title="Preferences & Audio Settings"
                className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center shrink-0 ${
                  showSettings 
                    ? 'bg-slate-800 text-white border-slate-600 shadow-inner' 
                    : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className={`w-3.5 h-3.5 transition-transform duration-500 ${showSettings ? 'rotate-90 text-indigo-400' : ''}`} />
              </button>

            </div>

            {/* --- THE FLASHCARD --- */}
            <div className="w-full relative group">
              
              {/* Subtle ambient drop shadow background glow */}
              <div className={`absolute -inset-1 rounded-[2rem] bg-gradient-to-r ${theme.progressFill} opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-30 -z-10`} />

              {/* Main Card Element (Clear visual distinction: lighter shade of dark blue/gray #1C2541, drop shadow) */}
              <div 
                onClick={handleFlip}
                className={`w-full min-h-[320px] sm:min-h-[360px] bg-[#1C2541] border border-slate-700/80 hover:border-slate-600 rounded-[2rem] shadow-2xl p-6 sm:p-10 flex flex-col justify-between cursor-pointer transition-all duration-300 select-none relative overflow-hidden ${theme.glow}`}
              >
                
                {/* Card Header Bar (Deck tag & Audio Button) */}
                <div className="flex items-center justify-between w-full z-10">
                  <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800/80">
                    {currentCard.level}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.char, 'zh-TW');
                    }}
                    title="Play Native Pronunciation"
                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500 transition-all shadow-md group/audio"
                  >
                    <Volume2 className="w-5 h-5 transition-transform group-hover/audio:scale-110" />
                  </button>
                </div>

                {/* Card Body: Large, centered, highly legible character ("人") */}
                <div className="my-auto flex flex-col items-center justify-center py-6 text-center z-10">
                  
                  {/* Pinyin hint (shown if flipped OR setting enabled) */}
                  <div className={`text-xl sm:text-2xl font-mono text-indigo-300 font-semibold mb-2 transition-opacity duration-300 ${
                    isFlipped || showPinyinHint ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                  }`}>
                    {currentCard.pinyin}
                  </div>

                  {/* The Chinese Character (Prominent sans-serif display) */}
                  <div className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white drop-shadow-md font-sans transition-transform duration-300 group-hover:scale-[1.03]">
                    {currentCard.char}
                  </div>

                  {/* Flipped Content: English Definition & Example Sentence */}
                  {isFlipped ? (
                    <div className="mt-6 space-y-4 w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-300 text-left">
                      
                      {/* English Definition Banner */}
                      <div className="w-full text-center">
                        <div className="text-lg sm:text-xl font-bold text-emerald-300 font-sans px-5 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 inline-block shadow-inner">
                          {currentCard.english}
                        </div>
                      </div>

                      {/* Sleek Example Sentence Box */}
                      {(() => {
                        const { chinese, pinyin, english } = parseExample(currentCard.example);
                        return (
                          <div className="w-full bg-[#141C33]/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-lg relative overflow-hidden group/ex border-l-4 border-l-indigo-500">
                            
                            {/* Header row: Label & Audio Play Button */}
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                Example Usage
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playAudio(chinese, 'zh-TW');
                                }}
                                title="Listen to Example Sentence"
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm border border-indigo-500/30 hover:border-indigo-500"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Listen</span>
                              </button>
                            </div>

                            {/* Chinese Sentence (Large & Clear) */}
                            <div className="text-base sm:text-lg font-bold text-white tracking-wide mb-1.5 leading-relaxed font-sans">
                              {chinese}
                            </div>

                            {/* Pinyin Reading */}
                            {pinyin && (
                              <div className="text-xs sm:text-sm font-mono text-indigo-300/90 mb-3 tracking-wide">
                                {pinyin}
                              </div>
                            )}

                            {/* English Translation */}
                            {english && (
                              <div className="text-xs sm:text-sm text-slate-300 font-normal pt-2.5 border-t border-slate-800/80 leading-relaxed flex items-start gap-2">
                                <span className="text-slate-500 font-bold select-none">TR:</span>
                                <span className="italic">{english}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-slate-400 font-medium tracking-wide flex items-center gap-1.5 opacity-80">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Click card or press SPACE to reveal translation</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Category tag & Card index */}
                <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-mono z-10 pt-2 border-t border-slate-800/60">
                  <span>Category: {currentCard.category || 'General Vocabulary'}</span>
                  <span>ID #{currentCard.id}</span>
                </div>

                {/* Decorative background grid pattern */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                />
              </div>
            </div>

            {/* --- PRIMARY ACTION BUTTON AREA ("Show Answer" or SRS Evaluation) --- */}
            <div className="w-full flex flex-col items-center space-y-4 pt-1">
              
              {!isFlipped ? (
                /* Primary Action Button ("Show Answer") */
                <button
                  onClick={handleFlip}
                  className={`w-full max-w-md py-4 px-8 rounded-2xl font-bold text-base sm:text-lg text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] ${theme.btnBg}`}
                >
                  <span>Show Answer</span>
                  
                  {/* Retain "SPACE" hint, styled subtly inside the button */}
                  <span className="px-2 py-0.5 text-[11px] font-mono tracking-widest uppercase bg-indigo-950/50 border border-white/20 text-indigo-100 rounded-md shadow-inner">
                    SPACE
                  </span>
                </button>
              ) : (
                /* When Flipped: Evaluation Action Buttons */
                <div className="w-full max-w-md grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                  
                  <button
                    onClick={() => handleRating('down')}
                    className="py-4 px-5 rounded-2xl font-bold text-sm sm:text-base text-rose-200 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 hover:border-rose-500 hover:text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
                  >
                    <ThumbsDown className="w-4 h-4 text-rose-400 group-hover/btn:text-white transition-colors" />
                    <span>Need Review</span>
                    <span className="text-[10px] font-mono opacity-60 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">← 1</span>
                  </button>

                  <button
                    onClick={() => handleRating('up')}
                    className="py-4 px-5 rounded-2xl font-bold text-sm sm:text-base text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 hover:text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
                  >
                    <ThumbsUp className="w-4 h-4 text-emerald-400 group-hover/btn:text-white transition-colors" />
                    <span>Mastered</span>
                    <span className="text-[10px] font-mono opacity-60 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">2 →</span>
                  </button>

                </div>
              )}

              {/* Quick Navigation Control Links (Prev / Next Card) */}
              <div className="flex items-center justify-between w-full max-w-md px-2 text-xs text-slate-400 pt-2">
                <button
                  onClick={handlePrevCard}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev Card
                </button>

                <span className="text-slate-500 font-mono text-[11px]">
                  Deck: <span className="text-slate-400">{selectedDeckName.split(' ')[0]}</span>
                </span>

                <button
                  onClick={handleNextCard}
                  className="flex items-center gap-1 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-slate-800/60"
                >
                  Next Card <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- FOOTER / SHORTCUTS BAR --- */}
      <footer className="w-full border-t border-slate-800/80 bg-[#0B132B]/80 backdrop-blur px-4 py-3 text-center text-xs text-slate-500 hidden sm:block">
        <div className="max-w-4xl mx-auto flex items-center justify-between font-mono">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">SPACE</kbd> Flip / Advance</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">←</kbd> Need Review</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">→</kbd> Mastered</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">R</kbd> Play Audio</span>
          </div>
          <div className="text-slate-400">
            Road to TOCFL C1 • Styled with Tailwind CSS
          </div>
        </div>
      </footer>

    </div>
  );
}
