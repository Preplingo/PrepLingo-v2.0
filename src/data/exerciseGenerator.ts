import { WordEntry, PartOfSpeech, CefrLevel } from '../types';

export type ExerciseMode = 'multiple-choice' | 'cloze-test' | 'synonyms';
export type CefrBand = 'a1-a2' | 'b1-b2';
export type ExerciseLevelFilter = 'all' | CefrBand;
export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D', 'E'];

export interface QuizOption {
  letter: OptionLetter;
  text: string;
  wordEntry: WordEntry;
}

export interface MultipleChoiceQuestion {
  id: string;
  cefrBand: CefrBand;
  cefrLabel: string;
  sentenceBefore: string;
  sentenceAfter: string;
  matchedText?: string;
  fullSentenceEn: string;
  fullSentenceTr: string;
  targetWord: WordEntry;
  options: QuizOption[];
  correctLetter: OptionLetter;
  explanationTr: string;
  examTip?: string;
}

export interface ClozeBlankQuestion {
  blankNumber: number; // 1..5
  targetWord: WordEntry;
  options: QuizOption[];
  correctLetter: OptionLetter;
  contextHintTr: string;
  explanationTr: string;
  examTip?: string;
}

export interface ClozeTestSession {
  passageId: string;
  passageIndex: number;
  totalPassagesInFilter: number;
  cefrBand: CefrBand;
  titleTr: string;
  topicTr: string;
  cefrBadge: string;
  segments: string[];
  blanks: ClozeBlankQuestion[];
  passageSummaryTr: string;
}

export interface SynonymQuestion {
  id: string;
  cefrBand: CefrBand;
  cefrLabel: string;
  promptWord: WordEntry;
  correctSynonym: WordEntry;
  options: QuizOption[];
  correctLetter: OptionLetter;
  explanationTr: string;
  contextSentenceEn?: string;
  contextSentenceTr?: string;
}

interface RawClozeBlank {
  blankNumber: number;
  word: string;
  pos: 'verb' | 'noun' | 'adj' | 'adv';
  contextHintTr: string;
  /** Optional explicit elementary distractors for A1-A2 passages to guarantee 100% CEFR purity */
  explicitDistractors?: string[];
}

export interface RawClozePassage {
  id: string;
  cefrBand: CefrBand;
  titleTr: string;
  topicTr: string;
  cefrBadge: string;
  /** Uses {{1}}, {{2}}, {{3}}, {{4}}, {{5}} markers */
  template: string;
  passageSummaryTr: string;
  blanks: RawClozeBlank[];
}

interface ElementarySeed {
  word: string;
  pos: 'verb' | 'noun' | 'adj' | 'adv';
  level: 'A1' | 'A2';
  tr: string;
  enEx: string;
  trEx: string;
}

/**
 * Authentic A1-A2 elementary everyday word bank (daily life, school, hobbies, travel, weather, communication).
 * Ensures elementary learners get genuine A1-A2 vocabulary & distractors without any academic leakage.
 */
const ELEMENTARY_WORD_SEEDS: ElementarySeed[] = [
  // Adjectives
  { word: 'happy', pos: 'adj', level: 'A1', tr: 'mutlu, sevinçli', enEx: 'I am very happy to see my best friend today.', trEx: 'Bugün en yakın arkadaşımı gördüğüm için çok mutluyum.' },
  { word: 'glad', pos: 'adj', level: 'A2', tr: 'memnun, mutlu', enEx: 'She was glad to hear the good news from home.', trEx: 'Evden gelen güzel haberi duyduğuna memnun oldu.' },
  { word: 'big', pos: 'adj', level: 'A1', tr: 'büyük, iri', enEx: 'We live in a big house near the city park.', trEx: 'Şehir parkının yakınında büyük bir evde yaşıyoruz.' },
  { word: 'large', pos: 'adj', level: 'A1', tr: 'geniş, büyük', enEx: 'The school has a large library with many books.', trEx: 'Okulun birçok kitabı olan geniş bir kütüphanesi var.' },
  { word: 'fast', pos: 'adj', level: 'A1', tr: 'hızlı, süratli', enEx: 'The new train to Ankara is very fast and clean.', trEx: 'Ankara\'ya giden yeni tren çok hızlı ve temiz.' },
  { word: 'quick', pos: 'adj', level: 'A1', tr: 'çabuk, hızlı', enEx: 'He ate a quick breakfast before catching the school bus.', trEx: 'Okul otobüsüne yetişmeden önce çabuk bir kahvaltı yaptı.' },
  { word: 'small', pos: 'adj', level: 'A1', tr: 'küçük, ufak', enEx: 'They stayed in a small hotel by the sea.', trEx: 'Deniz kenarında küçük bir otelde kaldılar.' },
  { word: 'little', pos: 'adj', level: 'A1', tr: 'küçük, minik', enEx: 'A little cat was sleeping under our garden chair.', trEx: 'Küçük bir kedi bahçe sandalyemizin altında uyuyordu.' },
  { word: 'hard', pos: 'adj', level: 'A1', tr: 'zor, güç', enEx: 'The last math question on the test was very hard.', trEx: 'Testteki son matematik sorusu çok zordu.' },
  { word: 'difficult', pos: 'adj', level: 'A1', tr: 'zor, güç', enEx: 'Learning new grammar rules is not difficult with practice.', trEx: 'Pratik yaparak yeni dilbilgisi kurallarını öğrenmek zor değil.' },
  { word: 'easy', pos: 'adj', level: 'A1', tr: 'kolay', enEx: 'This recipe is very easy to cook at home.', trEx: 'Bu tarifi evde pişirmek çok kolay.' },
  { word: 'simple', pos: 'adj', level: 'A1', tr: 'basit, sade, kolay', enEx: 'The teacher gave us a simple example on the board.', trEx: 'Öğretmen tahtada bize basit bir örnek verdi.' },
  { word: 'smart', pos: 'adj', level: 'A2', tr: 'zeki, akıllı', enEx: 'Our classmate Ali is very smart and always helps us.', trEx: 'Sınıf arkadaşımız Ali çok zeki ve bize her zaman yardım eder.' },
  { word: 'clever', pos: 'adj', level: 'A2', tr: 'akıllı, zeki', enEx: 'That was a clever answer to the puzzle.', trEx: 'Bulmacaya verilen akıllıca bir cevaptı.' },
  { word: 'afraid', pos: 'adj', level: 'A2', tr: 'korkmuş, endişeli', enEx: 'My little brother is afraid of dark rooms.', trEx: 'Küçük kardeşim karanlık odalardan korkar.' },
  { word: 'scared', pos: 'adj', level: 'A2', tr: 'korkmuş, ürkmüş', enEx: 'She felt scared when the lights went out suddenly.', trEx: 'Işıklar aniden sönünce korktu.' },
  { word: 'angry', pos: 'adj', level: 'A1', tr: 'kızgın, sinirli', enEx: 'He was angry because he missed the morning train.', trEx: 'Sabah trenini kaçırdığı için kızgındı.' },
  { word: 'mad', pos: 'adj', level: 'A2', tr: 'kızgın, öfkeli', enEx: 'Please do not be mad at me for being five minutes late.', trEx: 'Beş dakika geç kaldığım için lütfen bana kızma.' },
  { word: 'beautiful', pos: 'adj', level: 'A1', tr: 'güzel, hoş', enEx: 'We watched a beautiful sunset at the beach.', trEx: 'Sahilde güzel bir gün batımı izledik.' },
  { word: 'pretty', pos: 'adj', level: 'A1', tr: 'güzel, sevimli', enEx: 'There are many pretty flowers in our school garden.', trEx: 'Okul bahçemizde birçok güzel çiçek var.' },
  { word: 'quiet', pos: 'adj', level: 'A1', tr: 'sessiz, sakin', enEx: 'The library is a quiet place to read and study.', trEx: 'Kütüphane okumak ve ders çalışmak için sessiz bir yerdir.' },
  { word: 'silent', pos: 'adj', level: 'A2', tr: 'sessiz, çıt çıkmayan', enEx: 'The whole classroom became silent when the exam started.', trEx: 'Sınav başlayınca tüm sınıf sessizleşti.' },
  { word: 'sad', pos: 'adj', level: 'A1', tr: 'üzgün, hüzünlü', enEx: 'She looked sad because her holiday ended yesterday.', trEx: 'Tatili dün bittiği için üzgün görünüyordu.' },
  { word: 'unhappy', pos: 'adj', level: 'A2', tr: 'mutsuz, üzgün', enEx: 'He was unhappy with his rainy weekend weather.', trEx: 'Yağmurlu hafta sonu havasından mutsuzdu.' },
  { word: 'sick', pos: 'adj', level: 'A1', tr: 'hasta, rahatsız', enEx: 'Mert stayed in bed today because he felt sick.', trEx: 'Mert kendini hasta hissettiği için bugün yatakta kaldı.' },
  { word: 'ill', pos: 'adj', level: 'A2', tr: 'hasta, rahatsız', enEx: 'My aunt is ill, so we are taking hot soup to her.', trEx: 'Teyzem hasta, bu yüzden ona sıcak çorba götürüyoruz.' },
  { word: 'correct', pos: 'adj', level: 'A2', tr: 'doğru, hatasız', enEx: 'Please check if your phone number is correct.', trEx: 'Lütfen telefon numaranızın doğru olup olmadığını kontrol edin.' },
  { word: 'right', pos: 'adj', level: 'A1', tr: 'doğru, haklı', enEx: 'You gave the right answer to every question.', trEx: 'Her soruya doğru cevabı verdin.' },
  { word: 'tidy', pos: 'adj', level: 'A2', tr: 'düzenli, temiz', enEx: 'She always keeps her study desk neat and tidy.', trEx: 'Çalışma masasını her zaman düzenli ve temiz tutar.' },
  { word: 'clean', pos: 'adj', level: 'A1', tr: 'temiz, düzenli', enEx: 'Our hotel room was bright, warm, and very clean.', trEx: 'Otel odamız aydınlık, sıcak ve çok temizdi.' },
  { word: 'rich', pos: 'adj', level: 'A1', tr: 'zengin, varlıklı', enEx: 'The old businessman was rich and built a free library.', trEx: 'Yaşlı iş insanı zengindi ve ücretsiz bir kütüphane yaptırdı.' },
  { word: 'wealthy', pos: 'adj', level: 'A2', tr: 'varlıklı, zengin', enEx: 'A wealthy family donated new computers to the school.', trEx: 'Varlıklı bir aile okula yeni bilgisayarlar bağışladı.' },
  { word: 'famous', pos: 'adj', level: 'A1', tr: 'ünlü, meşhur', enEx: 'Izmir is famous for its sunny weather and sea breeze.', trEx: 'İzmir güneşli havası ve deniz meltemiyle ünlüdür.' },
  { word: 'popular', pos: 'adj', level: 'A1', tr: 'popüler, sevilen', enEx: 'Football is the most popular sport among students here.', trEx: 'Futbol buradaki öğrenciler arasında en popüler spordur.' },
  { word: 'important', pos: 'adj', level: 'A1', tr: 'önemli, mühim', enEx: 'Drinking enough water every day is very important.', trEx: 'Her gün yeterince su içmek çok önemlidir.' },
  { word: 'main', pos: 'adj', level: 'A2', tr: 'ana, başlıca, temel', enEx: 'The main entrance of the museum is on the left.', trEx: 'Müzenin ana girişi soldadır.' },
  { word: 'weird', pos: 'adj', level: 'A2', tr: 'tuhaf, garip', enEx: 'We heard a weird noise outside our tent at night.', trEx: 'Gece çadırımızın dışında tuhaf bir ses duyduk.' },
  { word: 'strange', pos: 'adj', level: 'A2', tr: 'garip, tuhaf', enEx: 'It felt strange to wear a winter coat in May.', trEx: 'Mayıs ayında kışlık palto giymek garip hissettirdi.' },
  { word: 'sunny', pos: 'adj', level: 'A1', tr: 'güneşli', enEx: 'It is warm and sunny today, so let us walk in the park.', trEx: 'Bugün hava ılık ve güneşli, o yüzden parkta yürüyelim.' },
  { word: 'rainy', pos: 'adj', level: 'A1', tr: 'yağmurlu', enEx: 'Take your umbrella because it looks very rainy outside.', trEx: 'Şemsiyeni al çünkü dışarısı çok yağmurlu görünüyor.' },
  { word: 'cold', pos: 'adj', level: 'A1', tr: 'soğuk', enEx: 'Wear a thick scarf because the wind is very cold today.', trEx: 'Kalın bir atkı tak çünkü rüzgâr bugün çok soğuk.' },
  { word: 'warm', pos: 'adj', level: 'A1', tr: 'ılık, sıcak', enEx: 'Spring afternoons are usually warm and pleasant.', trEx: 'Bahar öğleden sonraları genellikle ılık ve hoştur.' },
  { word: 'cheap', pos: 'adj', level: 'A1', tr: 'ucuz', enEx: 'Fresh fruit at the neighborhood market is very cheap.', trEx: 'Semt pazarındaki taze meyveler çok ucuz.' },
  { word: 'far', pos: 'adj', level: 'A1', tr: 'uzak', enEx: 'The airport is far from the town center.', trEx: 'Havalimanı şehir merkezinden uzaktır.' },
  { word: 'exciting', pos: 'adj', level: 'A1', tr: 'heyecan verici', enEx: 'Visiting a new city for the first time is very exciting.', trEx: 'Yeni bir şehri ilk kez ziyaret etmek çok heyecan vericidir.' },
  { word: 'noisy', pos: 'adj', level: 'A1', tr: 'gürültülü', enEx: 'The cafe near the main street was too noisy to study.', trEx: 'Ana caddenin yanındaki kafe ders çalışmak için fazla gürültülüydü.' },
  { word: 'heavy', pos: 'adj', level: 'A1', tr: 'ağır', enEx: 'My suitcase is too heavy to carry up the stairs alone.', trEx: 'Bavulum merdivenlerden tek başıma taşımak için çok ağır.' },
  { word: 'empty', pos: 'adj', level: 'A1', tr: 'boş', enEx: 'The bus was almost empty early on Sunday morning.', trEx: 'Pazar sabahı erken saatte otobüs neredeyse boştu.' },
  { word: 'hungry', pos: 'adj', level: 'A1', tr: 'aç', enEx: 'After swimming for two hours, everyone was very hungry.', trEx: 'İki saat yüzdükten sonra herkes çok acıkmıştı.' },
  { word: 'tired', pos: 'adj', level: 'A1', tr: 'yorgun', enEx: 'She went to sleep early because she was very tired.', trEx: 'Çok yorgun olduğu için erken uyudu.' },
  { word: 'busy', pos: 'adj', level: 'A1', tr: 'meşgul, yoğun', enEx: 'The train station is always busy on Friday evenings.', trEx: 'Tren istasyonu Cuma akşamları her zaman yoğun olur.' },
  { word: 'funny', pos: 'adj', level: 'A1', tr: 'komik, eğlenceli', enEx: 'We watched a funny comedy movie after dinner.', trEx: 'Akşam yemeğinden sonra komik bir komedi filmi izledik.' },
  { word: 'nice', pos: 'adj', level: 'A1', tr: 'hoş, nazik, güzel', enEx: 'Our new neighbors are very nice and friendly.', trEx: 'Yeni komşularımız çok hoş ve arkadaş canlısı.' },
  { word: 'kind', pos: 'adj', level: 'A1', tr: 'nazik, iyi kalpli', enEx: 'A kind woman showed us the way to the museum.', trEx: 'Nazik bir kadın bize müzeye giden yolu gösterdi.' },
  { word: 'fresh', pos: 'adj', level: 'A2', tr: 'taze, serin', enEx: 'I love buying fresh bread from the bakery every morning.', trEx: 'Her sabah fırından taze ekmek almayı seviyorum.' },
  { word: 'early', pos: 'adj', level: 'A1', tr: 'erken', enEx: 'We caught an early flight to catch the morning ferry.', trEx: 'Sabah vapuruna yetişmek için erken bir uçağa bindik.' },
  { word: 'late', pos: 'adj', level: 'A1', tr: 'geç', enEx: 'Sorry I am late; the traffic was very slow today.', trEx: 'Geç kaldığım için özür dilerim; trafik bugün çok yavaştı.' },

  // Verbs
  { word: 'start', pos: 'verb', level: 'A1', tr: 'başlamak, başlatmak', enEx: 'Our morning English classes start at nine o\'clock.', trEx: 'Sabah İngilizce derslerimiz saat dokuzda başlar.' },
  { word: 'begin', pos: 'verb', level: 'A1', tr: 'başlamak', enEx: 'The concert will begin right after sunset.', trEx: 'Konser gün batımından hemen sonra başlayacak.' },
  { word: 'finish', pos: 'verb', level: 'A1', tr: 'bitirmek, tamamlamak', enEx: 'I need to finish my homework before dinner.', trEx: 'Akşam yemeğinden önce ödevimi bitirmem gerekiyor.' },
  { word: 'end', pos: 'verb', level: 'A1', tr: 'sona ermek, bitirmek', enEx: 'The summer festival will end on Sunday night.', trEx: 'Yaz festivali Pazar gecesi sona erecek.' },
  { word: 'answer', pos: 'verb', level: 'A1', tr: 'cevap vermek, yanıtlamak', enEx: 'Please answer my message when you arrive safely.', trEx: 'Güvenle vardığında lütfen mesajıma cevap ver.' },
  { word: 'reply', pos: 'verb', level: 'A2', tr: 'yanıtlamak, karşılık vermek', enEx: 'She will reply to your email this afternoon.', trEx: 'Bu öğleden sonra e-postana yanıt verecek.' },
  { word: 'speak', pos: 'verb', level: 'A1', tr: 'konuşmak', enEx: 'Can you speak a little slower, please?', trEx: 'Lütfen biraz daha yavaş konuşabilir misiniz?' },
  { word: 'talk', pos: 'verb', level: 'A1', tr: 'konuşmak, sohbet etmek', enEx: 'We like to talk about movies during the lunch break.', trEx: 'Öğle arasında filmler hakkında sohbet etmeyi severiz.' },
  { word: 'close', pos: 'verb', level: 'A1', tr: 'kapatmak', enEx: 'Please close the window because it is getting cold.', trEx: 'Hava soğuduğu için lütfen pencereyi kapat.' },
  { word: 'shut', pos: 'verb', level: 'A2', tr: 'kapatmak, örtmek', enEx: 'Do not forget to shut the front door when you leave.', trEx: 'Çıkarken ön kapıyı kapatmayı unutma.' },
  { word: 'relax', pos: 'verb', level: 'A2', tr: 'rahatlamak, dinlenmek', enEx: 'I listen to soft music to relax after school.', trEx: 'Okuldan sonra rahatlamak için sakin müzik dinlerim.' },
  { word: 'read', pos: 'verb', level: 'A1', tr: 'okumak', enEx: 'She loves to read short stories before going to bed.', trEx: 'Yatmadan önce kısa hikâyeler okumayı çok sever.' },
  { word: 'travel', pos: 'verb', level: 'A1', tr: 'seyahat etmek, gezmek', enEx: 'We want to travel by train across the country next summer.', trEx: 'Gelecek yaz ülke boyunca trenle seyahat etmek istiyoruz.' },
  { word: 'try', pos: 'verb', level: 'A1', tr: 'denemek, çabalamak', enEx: 'You should try this delicious homemade apple pie.', trEx: 'Bu lezzetli ev yapımı elmalı turtayı denemelisin.' },
  { word: 'ask', pos: 'verb', level: 'A1', tr: 'sormak, istemek', enEx: 'Feel free to ask the teacher if you have a question.', trEx: 'Bir sorun varsa öğretmene sormaktan çekinme.' },
  { word: 'send', pos: 'verb', level: 'A1', tr: 'göndermek, yollamak', enEx: 'I will send you the holiday photos tonight.', trEx: 'Tatil fotoğraflarını sana bu akşam göndereceğim.' },
  { word: 'invite', pos: 'verb', level: 'A2', tr: 'davet etmek', enEx: 'We want to invite all our classmates to the picnic.', trEx: 'Tüm sınıf arkadaşlarımızı pikniğe davet etmek istiyoruz.' },
  { word: 'borrow', pos: 'verb', level: 'A2', tr: 'ödünç almak', enEx: 'Can I borrow your dictionary for five minutes?', trEx: 'Sözlüğünü beş dakikalığına ödünç alabilir miyim?' },
  { word: 'forget', pos: 'verb', level: 'A1', tr: 'unutmak', enEx: 'Do not forget to bring your student card tomorrow.', trEx: 'Yarın öğrenci kartını getirmeyi unutma.' },
  { word: 'arrive', pos: 'verb', level: 'A1', tr: 'varmak, ulaşmak', enEx: 'Our train will arrive at the central station at six.', trEx: 'Trenimiz saat altıda merkez istasyona varacak.' },
  { word: 'wait', pos: 'verb', level: 'A1', tr: 'beklemek', enEx: 'Let us wait for Selin near the main gate.', trEx: 'Ana kapının yanında Selin\'i bekleyelim.' },
  { word: 'explain', pos: 'verb', level: 'A2', tr: 'açıklamak, anlatmak', enEx: 'Could you explain this homework exercise again?', trEx: 'Bu ödev alıştırmasını tekrar açıklayabilir misiniz?' },
  { word: 'ate', pos: 'verb', level: 'A1', tr: 'yedi (eat fiilinin geçmiş zamanı)', enEx: 'We ate fresh fish at a small seaside restaurant.', trEx: 'Küçük bir sahil restoranında taze balık yedik.' },
  { word: 'slept', pos: 'verb', level: 'A1', tr: 'uyudu (sleep fiilinin geçmiş zamanı)', enEx: 'He slept for nine hours after the long walk.', trEx: 'Uzun yürüyüşten sonra dokuz saat uyudu.' },
  { word: 'wrote', pos: 'verb', level: 'A1', tr: 'yazdı (write fiilinin geçmiş zamanı)', enEx: 'She wrote a postcard to her grandmother from Rome.', trEx: 'Roma\'dan büyükannesine bir kartpostal yazdı.' },
  { word: 'drove', pos: 'verb', level: 'A2', tr: 'araba sürdü (drive geçmiş zamanı)', enEx: 'My father drove us to the bus station early.', trEx: 'Babam bizi erkenden otobüs terminaline arabayla bıraktı.' },
  { word: 'listens', pos: 'verb', level: 'A1', tr: 'dinler (listen fiili)', enEx: 'He listens to English podcasts on the bus every day.', trEx: 'Her gün otobüste İngilizce podcast dinler.' },
  { word: 'cooks', pos: 'verb', level: 'A1', tr: 'yemek pişirir (cook fiili)', enEx: 'My mother cooks wonderful vegetable soup in winter.', trEx: 'Annem kışın harika sebze çorbası pişirir.' },
  { word: 'swims', pos: 'verb', level: 'A1', tr: 'yüzer (swim fiili)', enEx: 'She swims in the pool twice a week.', trEx: 'Haftada iki kez havuzda yüzer.' },
  { word: 'drives', pos: 'verb', level: 'A1', tr: 'sürer (drive fiili)', enEx: 'He drives carefully when the road is wet.', trEx: 'Yol ıslakken dikkatlice araba sürer.' },
  { word: 'buys', pos: 'verb', level: 'A1', tr: 'satın alır (buy fiili)', enEx: 'She buys fresh oranges every Saturday morning.', trEx: 'Her Cumartesi sabahı taze portakal alır.' },
  { word: 'buy', pos: 'verb', level: 'A1', tr: 'satın almak', enEx: 'I want to buy a warm jacket for winter.', trEx: 'Kış için sıcak tutan bir ceket satın almak istiyorum.' },
  { word: 'cook', pos: 'verb', level: 'A1', tr: 'yemek pişirmek', enEx: 'My brother can cook pasta very well.', trEx: 'Kardeşim çok iyi makarna pişirebilir.' },
  { word: 'visit', pos: 'verb', level: 'A1', tr: 'ziyaret etmek', enEx: 'We are going to visit our grandparents next Sunday.', trEx: 'Gelecek Pazar büyükannemleri ziyaret edeceğiz.' },
  { word: 'watch', pos: 'verb', level: 'A1', tr: 'izlemek', enEx: 'Do you want to watch a football match tonight?', trEx: 'Bu akşam bir futbol maçı izlemek ister misin?' },
  { word: 'write', pos: 'verb', level: 'A1', tr: 'yazmak', enEx: 'Please write your full name at the top of the page.', trEx: 'Lütfen sayfanın üstüne tam adınızı yazın.' },
  { word: 'open', pos: 'verb', level: 'A1', tr: 'açmak', enEx: 'Can you open the window for some fresh air?', trEx: 'Biraz temiz hava için pencereyi açabilir misin?' },
  { word: 'help', pos: 'verb', level: 'A1', tr: 'yardım etmek', enEx: 'I always help my friends with their English pronunciation.', trEx: 'Arkadaşlarıma İngilizce telaffuz konusunda her zaman yardım ederim.' },
  { word: 'drink', pos: 'verb', level: 'A1', tr: 'içmek', enEx: 'I usually drink a cup of hot tea after lunch.', trEx: 'Öğle yemeğinden sonra genellikle bir fincan sıcak çay içerim.' },
  { word: 'walk', pos: 'verb', level: 'A1', tr: 'yürümek', enEx: 'We like to walk along the seaside every evening.', trEx: 'Her akşam sahil boyunca yürümeyi severiz.' },
  { word: 'play', pos: 'verb', level: 'A1', tr: 'oynamak, çalmak (enstrüman)', enEx: 'He learned to play the guitar last summer.', trEx: 'Geçen yaz gitar çalmayı öğrendi.' },
  { word: 'choose', pos: 'verb', level: 'A1', tr: 'seçmek', enEx: 'You can choose any book you like from the shelf.', trEx: 'Raftan beğendiğin herhangi bir kitabı seçebilirsin.' },

  // Nouns
  { word: 'trip', pos: 'noun', level: 'A1', tr: 'gezi, kısa yolculuk', enEx: 'Our school organized a day trip to the historical museum.', trEx: 'Okulumuz tarih müzesine günübirlik bir gezi düzenledi.' },
  { word: 'journey', pos: 'noun', level: 'A2', tr: 'yolculuk, seyahat', enEx: 'The bus journey through the mountains took four hours.', trEx: 'Dağlardan geçen otobüs yolculuğu dört saat sürdü.' },
  { word: 'present', pos: 'noun', level: 'A1', tr: 'hediye, armağan', enEx: 'She bought a lovely birthday present for her sister.', trEx: 'Kız kardeşi için hoş bir doğum günü hediyesi aldı.' },
  { word: 'gift', pos: 'noun', level: 'A2', tr: 'hediye, armağan', enEx: 'Thank you so much for this thoughtful gift.', trEx: 'Bu düşünceli hediye için çok teşekkür ederim.' },
  { word: 'shop', pos: 'noun', level: 'A1', tr: 'dükkân, mağaza', enEx: 'There is a small book shop across from our school.', trEx: 'Okulumuzun karşısında küçük bir kitap dükkânı var.' },
  { word: 'store', pos: 'noun', level: 'A1', tr: 'mağaza, market', enEx: 'I am going to the grocery store to buy milk and eggs.', trEx: 'Süt ve yumurta almak için markete gidiyorum.' },
  { word: 'street', pos: 'noun', level: 'A1', tr: 'cadde, sokak', enEx: 'Our bakery is on a quiet street with big trees.', trEx: 'Fırınımız büyük ağaçlı sakin bir sokakta.' },
  { word: 'road', pos: 'noun', level: 'A1', tr: 'yol, karayolu', enEx: 'Follow this road straight ahead to reach the beach.', trEx: 'Sahile ulaşmak için bu yolu dümdüz takip edin.' },
  { word: 'weather', pos: 'noun', level: 'A1', tr: 'hava durumu', enEx: 'Let us check the weather before planning our picnic.', trEx: 'Pikniğimizi planlamadan önce hava durumuna bakalım.' },
  { word: 'breakfast', pos: 'noun', level: 'A1', tr: 'kahvaltı', enEx: 'We always have cheese, olives, and tea for breakfast.', trEx: 'Kahvaltıda her zaman peynir, zeytin ve çay içeriz.' },
  { word: 'lesson', pos: 'noun', level: 'A1', tr: 'ders', enEx: 'My favorite lesson at school is English speaking.', trEx: 'Okuldaki en sevdiğim ders İngilizce konuşma dersi.' },
  { word: 'friends', pos: 'noun', level: 'A1', tr: 'arkadaşlar', enEx: 'I meet my friends at the cafe every Friday afternoon.', trEx: 'Her Cuma öğleden sonra arkadaşlarımla kafede buluşurum.' },
  { word: 'photos', pos: 'noun', level: 'A1', tr: 'fotoğraflar', enEx: 'She took lots of colorful photos during her holiday.', trEx: 'Tatili boyunca çok sayıda renkli fotoğraf çekti.' },
  { word: 'weekend', pos: 'noun', level: 'A1', tr: 'hafta sonu', enEx: 'What are you going to do this weekend?', trEx: 'Bu hafta sonu ne yapacaksın?' },
  { word: 'class', pos: 'noun', level: 'A1', tr: 'sınıf, kurs, ders', enEx: 'I joined a beginner Spanish class this semester.', trEx: 'Bu dönem başlangıç seviyesi İspanyolca kursuna katıldım.' },
  { word: 'hotel', pos: 'noun', level: 'A1', tr: 'otel', enEx: 'Our hotel has a nice garden and free breakfast.', trEx: 'Otelimizin güzel bir bahçesi ve ücretsiz kahvaltısı var.' },
  { word: 'umbrella', pos: 'noun', level: 'A1', tr: 'şemsiye', enEx: 'It started to rain, so I opened my umbrella quickly.', trEx: 'Yağmur yağmaya başladı, bu yüzden şemsiyemi hemen açtım.' },
  { word: 'airport', pos: 'noun', level: 'A1', tr: 'havalimanı', enEx: 'We arrived at the airport two hours before our flight.', trEx: 'Uçuşumuzdan iki saat önce havalimanına vardık.' },
  { word: 'ticket', pos: 'noun', level: 'A1', tr: 'bilet', enEx: 'I bought a round-trip train ticket online yesterday.', trEx: 'Dün internetten gidiş-dönüş tren bileti aldım.' },
  { word: 'homework', pos: 'noun', level: 'A1', tr: 'ev ödevi', enEx: 'She finished her English homework before six o\'clock.', trEx: 'İngilizce ödevini saat altıdan önce bitirdi.' },
  { word: 'library', pos: 'noun', level: 'A1', tr: 'kütüphane', enEx: 'Students often study together at the university library.', trEx: 'Öğrenciler genellikle üniversite kütüphanesinde birlikte çalışır.' },
  { word: 'kitchen', pos: 'noun', level: 'A1', tr: 'mutfak', enEx: 'Something delicious is cooking in the kitchen right now.', trEx: 'Şu anda mutfakta lezzetli bir şeyler pişiyor.' },
  { word: 'guitar', pos: 'noun', level: 'A1', tr: 'gitar', enEx: 'Can plays the guitar every evening in his room.', trEx: 'Can her akşam odasında gitar çalar.' },
  { word: 'garden', pos: 'noun', level: 'A1', tr: 'bahçe', enEx: 'My grandfather grows fresh tomatoes in his garden.', trEx: 'Dedem bahçesinde taze domates yetiştirir.' },
  { word: 'notebook', pos: 'noun', level: 'A1', tr: 'defter', enEx: 'Write every new English word in your notebook.', trEx: 'Her yeni İngilizce kelimeyi defterine yaz.' },
  { word: 'dictionary', pos: 'noun', level: 'A1', tr: 'sözlük', enEx: 'A good dictionary helps you learn words much faster.', trEx: 'İyi bir sözlük kelimeleri çok daha hızlı öğrenmene yardımcı olur.' },
  { word: 'camera', pos: 'noun', level: 'A1', tr: 'fotoğraf makinesi, kamera', enEx: 'Do not forget your camera for the mountain trip.', trEx: 'Dağ gezisi için fotoğraf makineni unutma.' },
  { word: 'chair', pos: 'noun', level: 'A1', tr: 'sandalye', enEx: 'Please sit on this comfortable chair near the window.', trEx: 'Lütfen pencerenin yanındaki bu rahat sandalyeye oturun.' },
  { word: 'bread', pos: 'noun', level: 'A1', tr: 'ekmek', enEx: 'We bought warm bread from the corner bakery.', trEx: 'Köşedeki fırından sıcak ekmek aldık.' },
  { word: 'shirt', pos: 'noun', level: 'A1', tr: 'gömlek', enEx: 'He wore a clean blue shirt for the school photo.', trEx: 'Okul fotoğrafı için temiz mavi bir gömlek giydi.' },
  { word: 'window', pos: 'noun', level: 'A1', tr: 'pencere', enEx: 'Look out the window; it is snowing softly!', trEx: 'Pencereden dışarı bak; hafifçe kar yağıyor!' },
  { word: 'pencil', pos: 'noun', level: 'A1', tr: 'kurşun kalem', enEx: 'I need a sharp pencil to draw a map.', trEx: 'Harita çizmek için sivri bir kurşun kaleme ihtiyacım var.' },
  { word: 'shoes', pos: 'noun', level: 'A1', tr: 'ayakkabılar', enEx: 'Wear comfortable shoes for our city walking tour.', trEx: 'Şehir yürüyüş turumuz için rahat ayakkabılar giy.' },
  { word: 'keys', pos: 'noun', level: 'A1', tr: 'anahtarlar', enEx: 'I left my house keys on the kitchen table.', trEx: 'Ev anahtarlarımı mutfak masasında bıraktım.' },
  { word: 'plates', pos: 'noun', level: 'A1', tr: 'tabaklar', enEx: 'Can you put the clean plates on the dining table?', trEx: 'Temiz tabakları yemek masasına koyabilir misin?' },
  { word: 'clouds', pos: 'noun', level: 'A1', tr: 'bulutlar', enEx: 'Dark clouds appeared in the sky before the rain.', trEx: 'Yağmurdan önce gökyüzünde kara bulutlar belirdi.' },
  { word: 'train', pos: 'noun', level: 'A1', tr: 'tren', enEx: 'The evening train leaves from platform three.', trEx: 'Akşam treni üçüncü perondan kalkıyor.' },
  { word: 'movie', pos: 'noun', level: 'A1', tr: 'film', enEx: 'Let us watch an adventure movie at the cinema tonight.', trEx: 'Bu akşam sinemada bir macera filmi izleyelim.' },
  { word: 'teacher', pos: 'noun', level: 'A1', tr: 'öğretmen', enEx: 'Our English teacher always smiles in class.', trEx: 'İngilizce öğretmenimiz derste her zaman gülümser.' },
  { word: 'coffee', pos: 'noun', level: 'A1', tr: 'kahve', enEx: 'Would you like a hot cup of coffee or tea?', trEx: 'Bir fincan sıcak kahve mi yoksa çay mı istersiniz?' },
  { word: 'dinner', pos: 'noun', level: 'A1', tr: 'akşam yemeği', enEx: 'My family eats dinner together at seven every evening.', trEx: 'Ailem her akşam saat yedide birlikte akşam yemeği yer.' },
  { word: 'soup', pos: 'noun', level: 'A1', tr: 'çorba', enEx: 'Hot lentil soup tastes wonderful on a rainy day.', trEx: 'Yağmurlu bir günde sıcak mercimek çorbası harika olur.' },
  { word: 'map', pos: 'noun', level: 'A1', tr: 'harita', enEx: 'We used a city map to find the train station.', trEx: 'Tren istasyonunu bulmak için bir şehir haritası kullandık.' },
  { word: 'music', pos: 'noun', level: 'A1', tr: 'müzik', enEx: 'Listening to cheerful music makes cleaning fun.', trEx: 'Neşeli müzik dinlemek temizliği eğlenceli hale getirir.' },
  { word: 'park', pos: 'noun', level: 'A1', tr: 'park', enEx: 'Children love riding bikes in the neighborhood park.', trEx: 'Çocuklar mahalle parkında bisiklet sürmeyi çok sever.' },
  { word: 'station', pos: 'noun', level: 'A1', tr: 'istasyon, durak', enEx: 'The metro station is only five minutes away on foot.', trEx: 'Metro istasyonu yürüyerek sadece beş dakika uzaklıkta.' },
  { word: 'beach', pos: 'noun', level: 'A1', tr: 'plaj, sahil', enEx: 'We spent the whole sunny afternoon at the beach.', trEx: 'Tüm güneşli öğleden sonrayı plajda geçirdik.' },
  { word: 'jacket', pos: 'noun', level: 'A1', tr: 'ceket, mont', enEx: 'Put on your warm jacket before going outside.', trEx: 'Dışarı çıkmadan önce kalın ceketini giy.' },
];



/**
 * 10 strictly CEFR-tagged Cloze Test passages:
 * - 4 A1-A2 short everyday passages (daily life, school, hobbies, travel, weather, basic tenses)
 * - 6 B1-B2 university-prep & academic passages (psychology/sleep, urban life, marine ecosystems, climate policy/taxes, medical AI ethics, empirical research)
 */
export const CLOZE_PASSAGES: RawClozePassage[] = [
  // ================= A1-A2 PASSAGES (4) =================
  {
    id: 'cloze_a1_weekend_trip',
    cefrBand: 'a1-a2',
    titleTr: 'Hafta Sonu Sahil Gezisi',
    topicTr: 'Seyahat & Hava Durumu',
    cefrBadge: 'A1–A2',
    template:
      'Last Saturday, my family and I decided to take a short {{1}} to the seaside. In the morning, the {{2}} was warm and sunny, so we packed our bags early. We arrived at the beach before noon and {{3}} our lunch under a big tree. In the afternoon, we swam in the sea and took many lovely {{4}}. Everyone felt very {{5}} when we returned home in the evening.',
    passageSummaryTr:
      'Geçen Cumartesi ailece sahile kısa bir gezi yaptık. Hava sıcak ve güneşliydi; öğle yemeğimizi yedik, denize girdik, fotoğraf çektik ve akşam eve çok mutlu döndük.',
    blanks: [
      {
        blankNumber: 1,
        word: 'trip',
        pos: 'noun',
        contextHintTr: 'Sahile yapılan kısa gezi için "take a short trip" kalıbı kullanılır.',
        explicitDistractors: ['chair', 'bread', 'lesson', 'shirt'],
      },
      {
        blankNumber: 2,
        word: 'weather',
        pos: 'noun',
        contextHintTr: 'Sıcak ve güneşli olan şey "weather" (hava durumu) kelimesidir.',
        explicitDistractors: ['window', 'kitchen', 'ticket', 'pencil'],
      },
      {
        blankNumber: 3,
        word: 'ate',
        pos: 'verb',
        contextHintTr: 'Geçmiş zamanda (Past Simple) öğle yemeği yemek için "ate" (eat fiilinin 2. hâli) kullanılır.',
        explicitDistractors: ['slept', 'wrote', 'drove', 'read'],
      },
      {
        blankNumber: 4,
        word: 'photos',
        pos: 'noun',
        contextHintTr: '"Take photos" kalıbı "fotoğraf çekmek" anlamına gelir.',
        explicitDistractors: ['shoes', 'keys', 'plates', 'clouds'],
      },
      {
        blankNumber: 5,
        word: 'happy',
        pos: 'adj',
        contextHintTr: 'Güzel bir geziden sonra herkesin kendini "mutlu" (happy) hissettiği anlatılıyor.',
        explicitDistractors: ['noisy', 'cheap', 'heavy', 'empty'],
      },
    ],
  },
  {
    id: 'cloze_a1_school_day',
    cefrBand: 'a1-a2',
    titleTr: 'Okulda Sıradan Bir Gün',
    topicTr: 'Okul Hayatı & Günlük Rutin',
    cefrBadge: 'A1–A2',
    template:
      'Every weekday, Elif wakes up at seven o\'clock and eats a quick {{1}} before leaving home. She usually takes the bus to school because her house is {{2}} from the campus. Her first English {{3}} starts at nine o\'clock in a bright classroom. During the break, she talks with her close {{4}} and drinks hot tea in the garden. After school, she finishes her homework and {{5}} to music in her room.',
    passageSummaryTr:
      'Elif hafta içi her gün erken kalkıp hızlı bir kahvaltı yapar, otobüsle okula gider, derslere katılır, teneffüste arkadaşlarıyla sohbet eder ve okuldan sonra müzik dinler.',
    blanks: [
      {
        blankNumber: 1,
        word: 'breakfast',
        pos: 'noun',
        contextHintTr: 'Sabah evden çıkmadan önce yenilen öğün "breakfast" (kahvaltı) kelimesidir.',
        explicitDistractors: ['umbrella', 'airport', 'guitar', 'jacket'],
      },
      {
        blankNumber: 2,
        word: 'far',
        pos: 'adj',
        contextHintTr: 'Otobüsle gitme nedeni olarak evinin kampüse "uzak" (far from) olması belirtiliyor.',
        explicitDistractors: ['hungry', 'sunny', 'cheap', 'funny'],
      },
      {
        blankNumber: 3,
        word: 'lesson',
        pos: 'noun',
        contextHintTr: 'Saat dokuzda aydınlık sınıfta başlayan ilk İngilizce "dersi" (lesson) anlatılıyor.',
        explicitDistractors: ['coffee', 'beach', 'ticket', 'soup'],
      },
      {
        blankNumber: 4,
        word: 'friends',
        pos: 'noun',
        contextHintTr: 'Teneffüste sohbet ettiği yakın "arkadaşları" (close friends) ifade ediliyor.',
        explicitDistractors: ['plates', 'clouds', 'keys', 'shoes'],
      },
      {
        blankNumber: 5,
        word: 'listens',
        pos: 'verb',
        contextHintTr: 'Geniş zamanda (Present Simple) "listen to music" kalıbı 3. tekil şahısta "listens" olur.',
        explicitDistractors: ['cooks', 'swims', 'drives', 'buys'],
      },
    ],
  },
  {
    id: 'cloze_a2_hobbies',
    cefrBand: 'a1-a2',
    titleTr: 'Boş Zaman ve Hobiler',
    topicTr: 'Hobiler & Günlük Yaşam',
    cefrBadge: 'A1–A2',
    template:
      'Having a fun hobby is a great way to {{1}} after a busy week at school. My brother enjoys playing football with his team every {{2}} in the local park. I prefer quieter activities, so I often {{3}} books or draw pictures at home. Next month, I am going to join a cooking {{4}} to learn easy Italian meals. I believe this new hobby will be very {{5}} for me.',
    passageSummaryTr:
      'Eğlenceli bir hobi edinmek yoğun bir okul haftasından sonra dinlenmenin harika bir yoludur. Kardeşim hafta sonları futbol oynar, ben ise kitap okur ve yemek kursuna katılmayı planlıyorum.',
    blanks: [
      {
        blankNumber: 1,
        word: 'relax',
        pos: 'verb',
        contextHintTr: 'Yoğun bir okul haftasından sonra "rahatlamak / dinlenmek" (relax) anlamı gerekir.',
        explicitDistractors: ['forget', 'borrow', 'shut', 'arrive'],
      },
      {
        blankNumber: 2,
        word: 'weekend',
        pos: 'noun',
        contextHintTr: 'Parkta takımıyla her "hafta sonu" (every weekend) futbol oynadığı belirtiliyor.',
        explicitDistractors: ['kitchen', 'umbrella', 'pencil', 'camera'],
      },
      {
        blankNumber: 3,
        word: 'read',
        pos: 'verb',
        contextHintTr: 'Evde sakin etkinlik olarak kitap "okumak" (read books) fiili gerekir.',
        explicitDistractors: ['cook', 'drive', 'swim', 'wait'],
      },
      {
        blankNumber: 4,
        word: 'class',
        pos: 'noun',
        contextHintTr: 'Kolay İtalyan yemekleri öğrenmek için yemek "kursuna / dersine" (cooking class) katılmak anlatılıyor.',
        explicitDistractors: ['airport', 'weather', 'train', 'street'],
      },
      {
        blankNumber: 5,
        word: 'exciting',
        pos: 'adj',
        contextHintTr: 'Gelecek zaman cümlesinde bu yeni hobinin çok "heyecan verici" (exciting) olacağı söyleniyor.',
        explicitDistractors: ['cold', 'heavy', 'angry', 'empty'],
      },
    ],
  },
  {
    id: 'cloze_a2_summer_holiday',
    cefrBand: 'a1-a2',
    titleTr: 'Yaz Tatili Planı',
    topicTr: 'Seyahat & İletişim',
    cefrBadge: 'A1–A2',
    template:
      'Next summer, my best friend and I will {{1}} to Antalya for five days. We already booked a small {{2}} near the old town so we can walk everywhere. Every morning, we plan to swim in the sea and {{3}} new local foods at small cafes. If we get lost on the street, we will politely {{4}} local people for directions. I will definitely {{5}} you a postcard as soon as we arrive.',
    passageSummaryTr:
      'Gelecek yaz en yakın arkadaşımla beş günlüğüne Antalya\'ya seyahat edeceğiz. Küçük bir otel ayırttık; denize girecek, yöresel yemekler deneyecek ve varır varmaz kartpostal göndereceğiz.',
    blanks: [
      {
        blankNumber: 1,
        word: 'travel',
        pos: 'verb',
        contextHintTr: 'Gelecek yaz Antalya\'ya "seyahat etmek" (will travel) gelecek zaman yapısı gerekir.',
        explicitDistractors: ['cook', 'close', 'sleep', 'wash'],
      },
      {
        blankNumber: 2,
        word: 'hotel',
        pos: 'noun',
        contextHintTr: 'Tatil için önceden ayırtılan küçük "otel" (booked a small hotel) kelimesi uygundur.',
        explicitDistractors: ['notebook', 'guitar', 'umbrella', 'soup'],
      },
      {
        blankNumber: 3,
        word: 'try',
        pos: 'verb',
        contextHintTr: 'Yeni yöresel yemekleri "denemek" (try new local foods) anlamı gerekir.',
        explicitDistractors: ['wait', 'arrive', 'forget', 'shut'],
      },
      {
        blankNumber: 4,
        word: 'ask',
        pos: 'verb',
        contextHintTr: 'Yol tarifi istemek/sormak için "ask ... for directions" kalıbı kullanılır.',
        explicitDistractors: ['buy', 'watch', 'play', 'drink'],
      },
      {
        blankNumber: 5,
        word: 'send',
        pos: 'verb',
        contextHintTr: 'Kartpostal "göndermek" için "send a postcard" fiili kullanılır.',
        explicitDistractors: ['walk', 'swim', 'eat', 'open'],
      },
    ],
  },

  // ================= B1-B2 PASSAGES (3) =================
  {
    id: 'cloze_sleep_memory',
    cefrBand: 'b1-b2',
    titleTr: 'Uyku, Bellek ve Bilişsel Performans',
    topicTr: 'Psikoloji & Eğitim',
    cefrBadge: 'B1–B2',
    template:
      'Neuroscience research consistently demonstrates that uninterrupted sleep plays a {{1}} role in memory consolidation. During deep sleep cycles, the brain reorganizes neural pathways to {{2}} analytical reasoning and creative problem-solving. University students who regularly {{3}} adequate rest often experience sharp declines in concentration during exams. Over extended periods, chronic sleep deprivation causes both immune defenses and emotional regulation to {{4}}. Academic counselors therefore advise learners to {{5}} consistent sleep schedules alongside structured study habits.',
    passageSummaryTr:
      'Sinirbilim araştırmaları kesintisiz uykunun bellek pekiştirmede kritik rol oynadığını, düzenli dinlenmeyi ihmal etmenin ise bilişsel ve fiziksel performansı bozduğunu göstermektedir.',
    blanks: [
      {
        blankNumber: 1,
        word: 'crucial',
        pos: 'adj',
        contextHintTr: '"Play a crucial role" akademik metinlerde "can alıcı / kritik bir rol oynamak" kalıbıdır.',
      },
      {
        blankNumber: 2,
        word: 'enhance',
        pos: 'verb',
        contextHintTr: 'Analitik akıl yürütme ve problem çözme becerisini "geliştirmek / artırmak" anlamı gerekir.',
      },
      {
        blankNumber: 3,
        word: 'neglect',
        pos: 'verb',
        contextHintTr: 'Yeterli dinlenmeyi düzenli olarak "ihmal eden" öğrencilerden söz ediliyor.',
      },
      {
        blankNumber: 4,
        word: 'deteriorate',
        pos: 'verb',
        contextHintTr: 'Kronik uyku yoksunluğunun bağışıklık ve duygu düzenlemesinin "kötüleşmesine / bozulmasına" yol açtığı anlatılıyor.',
      },
      {
        blankNumber: 5,
        word: 'maintain',
        pos: 'verb',
        contextHintTr: 'Tutarlı bir uyku düzenini "sürdürmek / korumak" anlamında fiil gerekir.',
      },
    ],
  },
  {
    id: 'cloze_urbanization',
    cefrBand: 'b1-b2',
    titleTr: 'Kentleşme ve Toplumsal Altyapı',
    topicTr: 'Sosyoloji & Şehircilik',
    cefrBadge: 'B1–B2',
    template:
      'Rapid migration toward metropolitan hubs has triggered {{1}} transformations in housing and public transportation. Municipal authorities frequently struggle to modernize aging {{2}} fast enough to accommodate growing populations. City planners must carefully {{3}} limited budgets between green spaces, transit corridors, and affordable housing. Poorly planned neighborhoods leave low-income communities particularly {{4}} to extreme heat waves and flooding. Thoughtful urban design, however, can {{5}} social cohesion and dramatically improve daily quality of life.',
    passageSummaryTr:
      'Büyükşehirlere hızlı göç, altyapı ve bütçe yönetimini zorlaştırırken; bilinçli kent tasarımı toplumsal uyumu teşvik ederek yaşam kalitesini yükseltebilir.',
    blanks: [
      {
        blankNumber: 1,
        word: 'widespread',
        pos: 'adj',
        contextHintTr: 'Konut ve ulaşımda "yaygın / geniş çapta" dönüşümleri niteleyen sıfat gerekir.',
      },
      {
        blankNumber: 2,
        word: 'infrastructure',
        pos: 'noun',
        contextHintTr: 'Belediyelerin eskiyen kentsel "altyapıyı" modernize etme zorluğundan bahsediliyor.',
      },
      {
        blankNumber: 3,
        word: 'allocate',
        pos: 'verb',
        contextHintTr: 'Sınırlı bütçeyi farklı alanlara "tahsis etmek / paylaştırmak" anlamındaki akademik fiil gerekir.',
      },
      {
        blankNumber: 4,
        word: 'vulnerable',
        pos: 'adj',
        contextHintTr: '"Vulnerable to ..." kalıbı aşırı sıcak ve sellere karşı "savunmasız / kırılgan" anlamı verir.',
      },
      {
        blankNumber: 5,
        word: 'foster',
        pos: 'verb',
        contextHintTr: 'Toplumsal uyumu "teşvik etmek / geliştirmek" anlamında kullanılan fiil gerekir.',
      },
    ],
  },
  {
    id: 'cloze_marine',
    cefrBand: 'b1-b2',
    titleTr: 'Deniz Ekosistemleri ve Biyoçeşitlilik',
    topicTr: 'Biyoloji & Ekoloji',
    cefrBadge: 'B1–B2',
    template:
      'Marine biologists are racing to {{1}} fragile coral ecosystems threatened by rising ocean temperatures. Even modest shifts in water acidity can {{2}} delicate food webs across entire coastal regions. A direct {{3}} of reef degradation is the sharp decline in fish populations that millions of people rely on. International treaties urge coastal nations to {{4}} protected marine reserves and curb plastic pollution. Encouragingly, local conservation projects have already shown that targeted intervention can gradually {{5}} damaged habitats.',
    passageSummaryTr:
      'Artan okyanus sıcaklıkları hassas mercan ekosistemlerini tehdit etmekte, ancak hedefli koruma önlemleriyle zarar görmüş yaşam alanları kademeli olarak onarılabilmektedir.',
    blanks: [
      {
        blankNumber: 1,
        word: 'sustain',
        pos: 'verb',
        contextHintTr: 'Tehdit altındaki hassas mercan ekosistemlerini "sürdürmek / ayakta tutmak" anlamı gerekir.',
      },
      {
        blankNumber: 2,
        word: 'disrupt',
        pos: 'verb',
        contextHintTr: 'Su asitliğindeki küçük değişimlerin bile besin zincirini "aksatması / düzenini bozması" anlatılıyor.',
      },
      {
        blankNumber: 3,
        word: 'consequence',
        pos: 'noun',
        contextHintTr: 'Resif bozulmasının doğrudan bir "sonucu / neticesi" olarak balık popülasyonundaki düşüş veriliyor.',
      },
      {
        blankNumber: 4,
        word: 'implement',
        pos: 'verb',
        contextHintTr: 'Korunan deniz rezervlerini "uygulamak / yürürlüğe koymak" anlamında fiil gerekir.',
      },
      {
        blankNumber: 5,
        word: 'restore',
        pos: 'verb',
        contextHintTr: 'Zarar görmüş habitatları "eski haline getirmek / onarmak" bağlamına uygun fiil gerekir.',
      },
    ],
  },

  // ================= B1-B2 ACADEMIC PASSAGES (CONTINUED) =================
  {
    id: 'cloze_climate',
    cefrBand: 'b1-b2',
    titleTr: 'İklim Politikaları, Vergi Teşvikleri ve Enerji',
    topicTr: 'Küresel Çevre & Ekonomi',
    cefrBadge: 'B1–B2',
    template:
      'Governments worldwide are adopting clean technologies to {{1}} the severe consequences of carbon emissions. Transitioning away from fossil fuels requires {{2}} financial investment in solar and wind infrastructure. {{3}}, policymakers have introduced tax incentives to encourage private companies to participate. Without decisive action, industrial growth will continue to {{4}} vital natural resources at an alarming rate. Ultimately, renewable energy represents the most economically {{5}} path toward long-term ecological stability.',
    passageSummaryTr:
      'Dünya genelindeki hükümetler karbon emisyonlarının ağır sonuçlarını hafifletmek için vergi teşvikleri ve temiz enerji yatırımlarıyla uzun vadeli ekolojik istikrarı hedeflemektedir.',
    blanks: [
      {
        blankNumber: 1,
        word: 'mitigate',
        pos: 'verb',
        contextHintTr: 'Karbon emisyonlarının olumsuz sonuçlarını "hafifletmek / etkisini azaltmak" anlamı gerekir.',
      },
      {
        blankNumber: 2,
        word: 'substantial',
        pos: 'adj',
        contextHintTr: 'Fosil yakıtlardan geçişin "hatırı sayılır / büyük ölçüde" finansal yatırım gerektirdiği vurgulanıyor.',
      },
      {
        blankNumber: 3,
        word: 'consequently',
        pos: 'adv',
        contextHintTr: 'Önceki cümledeki yüksek yatırım gereksiniminin sonucu olarak "sonuç olarak / bu nedenle" geçiş zarfı gerekir.',
      },
      {
        blankNumber: 4,
        word: 'deplete',
        pos: 'verb',
        contextHintTr: 'Endüstriyel büyümenin doğal kaynakları hızla "tüketmesi" bağlamına uygun fiil gerekir.',
      },
      {
        blankNumber: 5,
        word: 'viable',
        pos: 'adj',
        contextHintTr: 'Ekonomik açıdan en "uygulanabilir / sürdürülebilir" yol anlamı aranıyor.',
      },
    ],
  },
  {
    id: 'cloze_ai_medicine',
    cefrBand: 'b1-b2',
    titleTr: 'Tıpta Yapay Zekâ ve Etik Standartlar',
    topicTr: 'Tıp, Algoritma & Etik',
    cefrBadge: 'B1–B2',
    template:
      'Recent advances in machine learning allow diagnostic algorithms to produce remarkably {{1}} assessments of medical imaging. These intelligent systems can {{2}} early signs of cellular abnormalities long before symptoms become visible. {{3}}, automated triage software reduces administrative pressure on overworked hospital personnel. Despite these benefits, medical boards must establish strict {{4}} standards regarding patient privacy and algorithmic bias. Clinical experts emphasize that artificial intelligence is designed to {{5}} human physicians rather than replace them.',
    passageSummaryTr:
      'Makine öğrenimi tıbbi görüntülemede yüksek doğruluklu tanılar sunmakta, etik ve gizlilik çerçevesinde hekimlerin kararlarını desteklemek üzere tasarlanmaktadır.',
    blanks: [
      {
        blankNumber: 1,
        word: 'accurate',
        pos: 'adj',
        contextHintTr: 'Tanı algoritmalarının son derece "doğru / hatasız" değerlendirmeler ürettiği ifade ediliyor.',
      },
      {
        blankNumber: 2,
        word: 'detect',
        pos: 'verb',
        contextHintTr: 'Hücresel anormalliklerin erken işaretlerini "tespit etmek / algılamak" anlamı gerekir.',
      },
      {
        blankNumber: 3,
        word: 'moreover',
        pos: 'adv',
        contextHintTr: 'Önceki olumlu özelliğe ek bir avantaj sunulduğu için "dahası / üstelik" bağlayıcı zarfı uygundur.',
      },
      {
        blankNumber: 4,
        word: 'ethical',
        pos: 'adj',
        contextHintTr: 'Hasta gizliliği ve algoritmik önyargı konusunda katı "etik / ahlaki" standartlar vurgulanıyor.',
      },
      {
        blankNumber: 5,
        word: 'complement',
        pos: 'verb',
        contextHintTr: 'Yapay zekânın doktorların yerini almak yerine onları "tamamlamak / bütünlemek" için tasarlandığı belirtiliyor.',
      },
    ],
  },
  {
    id: 'cloze_research',
    cefrBand: 'b1-b2',
    titleTr: 'Ampirik Araştırma ve Bilimsel Yöntem',
    topicTr: 'Akademik Metodoloji',
    cefrBadge: 'B1–B2',
    template:
      'Every rigorous empirical study begins with a clear, testable {{1}} grounded in existing scholarly literature. Independent peer reviewers carefully {{2}} the methodology and statistical analyses before approving publication. Conclusions remain tentative unless supported by reproducible {{3}} gathered under controlled conditions. Small sample sizes or unreported conflicts of interest can seriously {{4}} the credibility of experimental findings. Open-data repositories now encourage researchers to maintain fully {{5}} records so future teams can verify results.',
    passageSummaryTr:
      'Ampirik çalışmalar sınanabilir bir hipotezle başlar; bağımsız hakem incelemesi, tekrarlanabilir kanıtlar ve şeffaf veri kayıtlarıyla bilimsel güvenilirlik kazanır.',
    blanks: [
      {
        blankNumber: 1,
        word: 'hypothesis',
        pos: 'noun',
        contextHintTr: 'Her deneysel çalışmanın net ve test edilebilir bir "hipotez / varsayım" ile başladığı vurgulanıyor.',
      },
      {
        blankNumber: 2,
        word: 'scrutinize',
        pos: 'verb',
        contextHintTr: 'Hakemlerin yöntemi ve analizleri "dikkatle incelemesi / mercek altına alması" anlatılıyor.',
      },
      {
        blankNumber: 3,
        word: 'evidence',
        pos: 'noun',
        contextHintTr: 'Sonuçların tekrarlanabilir "kanıt / delil" ile desteklenmesi gerektiği ifade ediliyor.',
      },
      {
        blankNumber: 4,
        word: 'undermine',
        pos: 'verb',
        contextHintTr: 'Küçük örneklemlerin bulguların güvenilirliğini "baltalaması / zayıflatması" anlamı gerekir.',
      },
      {
        blankNumber: 5,
        word: 'transparent',
        pos: 'adj',
        contextHintTr: 'Gelecek ekiplerin doğrulayabilmesi için tamamen "şeffaf / açık" kayıtlar tutulması öneriliyor.',
      },
    ],
  },
];

/**
 * Strictly CEFR-separated synonym banks:
 * - A1-A2: Elementary / pre-intermediate everyday pairs (happy-glad, big-large, start-begin, fast-quick...)
 * - B1-B2: Intermediate / Upper-Intermediate university prep & academic pairs
 */
const A1_A2_SYNONYM_PAIRS: [string, string][] = [
  ['happy', 'glad'],
  ['big', 'large'],
  ['start', 'begin'],
  ['fast', 'quick'],
  ['small', 'little'],
  ['hard', 'difficult'],
  ['easy', 'simple'],
  ['smart', 'clever'],
  ['finish', 'end'],
  ['answer', 'reply'],
  ['trip', 'journey'],
  ['afraid', 'scared'],
  ['angry', 'mad'],
  ['beautiful', 'pretty'],
  ['quiet', 'silent'],
  ['sad', 'unhappy'],
  ['sick', 'ill'],
  ['speak', 'talk'],
  ['close', 'shut'],
  ['correct', 'right'],
  ['present', 'gift'],
  ['shop', 'store'],
  ['street', 'road'],
  ['tidy', 'clean'],
  ['rich', 'wealthy'],
  ['famous', 'popular'],
  ['important', 'main'],
  ['weird', 'strange'],
];

const B1_B2_SYNONYM_PAIRS: [string, string][] = [
  ['enhance', 'improve'],
  ['crucial', 'essential'],
  ['obtain', 'acquire'],
  ['evaluate', 'assess'],
  ['maintain', 'sustain'],
  ['demonstrate', 'illustrate'],
  ['investigate', 'examine'],
  ['emerge', 'appear'],
  ['impact', 'effect'],
  ['consequence', 'outcome'],
  ['diminish', 'decline'],
  ['alter', 'modify'],
  ['anticipate', 'expect'],
  ['apparent', 'evident'],
  ['confirm', 'verify'],
  ['contemporary', 'modern'],
  ['conventional', 'traditional'],
  ['detect', 'discover'],
  ['determine', 'establish'],
  ['distinct', 'separate'],
  ['diverse', 'various'],
  ['embrace', 'accept'],
  ['encounter', 'face'],
  ['ensure', 'guarantee'],
  ['equivalent', 'equal'],
  ['exclude', 'omit'],
  ['exhibit', 'display'],
  ['foster', 'promote'],
  ['fundamental', 'primary'],
  ['imply', 'suggest'],
  ['incorporate', 'integrate'],
  ['intense', 'severe'],
  ['neglect', 'overlook'],
  ['notion', 'concept'],
  ['overcome', 'conquer'],
  ['perceive', 'notice'],
  ['postpone', 'delay'],
  ['potential', 'possible'],
  ['pursue', 'follow'],
  ['resolve', 'solve'],
  ['stimulate', 'encourage'],
  ['substitute', 'replace'],
  ['transform', 'convert'],
  ['transparent', 'clear'],
  ['mitigate', 'alleviate'],
  ['deteriorate', 'degrade'],
  ['substantial', 'enormous'],
  ['implement', 'enforce'],
  ['trigger', 'induce'],
  ['allocate', 'distribute'],
  ['comprehensive', 'extensive'],
  ['ambiguous', 'obscure'],
  ['explicit', 'clear'],
  ['accurate', 'precise'],
  ['vulnerable', 'susceptible'],
  ['facilitate', 'enable'],
  ['moreover', 'furthermore'],
  ['consequently', 'therefore'],
  ['abolish', 'eliminate'],
  ['advocate', 'endorse'],
  ['cease', 'terminate'],
  ['conduct', 'carry out'],
  ['constrain', 'restrict'],
  ['credible', 'plausible'],
  ['deplete', 'exhaust'],
  ['disclose', 'reveal'],
  ['drastic', 'radical'],
  ['endure', 'tolerate'],
  ['exceed', 'surpass'],
  ['feasible', 'viable'],
  ['hence', 'therefore'],
  ['inadequate', 'deficient'],
  ['infer', 'deduce'],
  ['inhibit', 'suppress'],
  ['intrinsic', 'inherent'],
  ['justify', 'validate'],
  ['legitimate', 'valid'],
  ['notable', 'prominent'],
  ['offset', 'compensate'],
  ['predominant', 'dominant'],
  ['preliminary', 'initial'],
  ['prevail', 'dominate'],
  ['replicate', 'copy'],
  ['scrutinize', 'inspect'],
  ['simultaneous', 'concurrent'],
  ['solely', 'exclusively'],
  ['undermine', 'weaken'],
  ['undertake', 'embark'],
  ['uniform', 'consistent'],
  ['widespread', 'prevalent'],
];

/**
 * Heavy academic / policy / climate / economic / research terms that must NEVER appear in A1-A2 tests,
 * and belong in B1-B2 academic tests.
 */
const HEAVY_ACADEMIC_KEYWORDS = [
  'tax', 'taxes', 'fiscal', 'economy', 'economic', 'economical', 'inflation', 'subsidy', 'subsidize',
  'tariff', 'revenue', 'monetary', 'budget', 'recession', 'gdp', 'macroeconomic', 'debt',
  'climate', 'emission', 'emissions', 'carbon', 'fossil', 'ecological', 'ecosystem', 'biodiversity',
  'deforestation', 'pollution', 'sustainability', 'greenhouse', 'ozone', 'drought',
  'policy', 'policymaker', 'legislation', 'parliament', 'treaty', 'treaties', 'diplomatic', 'sovereignty',
  'regulation', 'regulatory', 'sanction', 'jurisdiction', 'constitutional', 'bureaucracy', 'governance',
  'hypothesis', 'empirical', 'methodology', 'paradigm', 'statistical', 'peer review', 'dissertation',
  'thesis', 'protocol', 'clinical', 'algorithm', 'algorithmic', 'cellular', 'molecular', 'neuroscience',
  'cognitive', 'epidemic', 'pathology', 'genetic', 'genome', 'infrastructure', 'demographic',
  'geopolitical', 'socioeconomic', 'ideology', 'rhetoric', 'ethics', 'ethical', 'proficiency',
  'scholarly', 'academic', 'researcher', 'researchers', 'experiment', 'experimental', 'survey',
  'abbreviate', 'abolish', 'abstain', 'alleviate', 'ambiguous', 'allocate', 'arbitrary', 'attribute',
  'cease', 'coherent', 'compile', 'constrain', 'contradict', 'credible', 'degrade', 'deplete',
  'deteriorate', 'deviate', 'disclose', 'disrupt', 'distort', 'drastic', 'endorse', 'erode',
  'exacerbate', 'feasible', 'fluctuate', 'hamper', 'impede', 'inadequate', 'induce', 'infer',
  'inherent', 'inhibit', 'intrinsic', 'justify', 'legitimate', 'manipulate', 'mitigate', 'obscure',
  'offset', 'plausible', 'predominant', 'preliminary', 'prevail', 'prohibit', 'profound', 'prominent',
  'rational', 'reinforce', 'replicate', 'rigorous', 'robust', 'scrutinize', 'simultaneous', 'solely',
  'sophisticated', 'speculate', 'stringent', 'subsequent', 'suppress', 'surpass', 'susceptible',
  'tangible', 'tentative', 'terminate', 'threshold', 'transparent', 'trivial', 'ubiquitous',
  'undermine', 'undertake', 'unprecedented', 'utilize', 'viable', 'vulnerable', 'widespread',
];

const HEAVY_KEYWORD_REGEX = new RegExp(
  `\\b(${HEAVY_ACADEMIC_KEYWORDS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

const ACADEMIC_B1_B2_WORD_SET = new Set<string>([
  ...B1_B2_SYNONYM_PAIRS.flatMap(([a, b]) => [a.toLowerCase(), b.toLowerCase()]),
  'abbreviate', 'abolish', 'abruptly', 'abstain from', 'advocate', 'alleviate', 'allocate',
  'ambiguous', 'arbitrary', 'cease', 'coherent', 'complement', 'comprehensive', 'consequently',
  'constrain', 'contradict', 'credible', 'deficient', 'degrade', 'deplete', 'deteriorate',
  'deviate', 'disclose', 'disrupt', 'distort', 'drastic', 'empirical', 'endorse', 'erode',
  'ethical', 'exceed', 'exhibit', 'explicit', 'feasible', 'fluctuate', 'furthermore', 'hamper',
  'hence', 'hypothesis', 'impede', 'implement', 'inadequate', 'induce', 'infer', 'infrastructure',
  'inherent', 'inhibit', 'intrinsic', 'justify', 'legitimate', 'manipulate', 'mitigate', 'moreover',
  'notable', 'obscure', 'offset', 'paradigm', 'plausible', 'predominant', 'preliminary', 'prevail',
  'prohibit', 'profound', 'prominent', 'rational', 'reinforce', 'replicate', 'rigorous', 'robust',
  'scrutinize', 'simultaneous', 'solely', 'sophisticated', 'speculate', 'stringent', 'subsequent',
  'subsidize', 'substantial', 'suppress', 'surpass', 'susceptible', 'tangible', 'tentative',
  'terminate', 'threshold', 'trigger', 'trivial', 'undermine', 'undertake', 'uniform',
  'unprecedented', 'utilize', 'viable', 'vulnerable', 'widespread',
]);

export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function normalizePosGroup(pos?: PartOfSpeech | string): 'verb' | 'noun' | 'adj' | 'adv' | 'conjunction' | 'other' {
  if (!pos) return 'other';
  const p = pos.toLowerCase();
  if (p === 'verb' || p === 'v') return 'verb';
  if (p === 'noun' || p === 'n') return 'noun';
  if (p === 'adjective' || p === 'adj') return 'adj';
  if (p === 'adverb' || p === 'adv') return 'adv';
  if (p === 'conjunction' || p === 'conj') return 'conjunction';
  return 'other';
}

export function getPosTurkishName(pos?: PartOfSpeech | string): string {
  switch (normalizePosGroup(pos)) {
    case 'verb':
      return 'Fiil';
    case 'noun':
      return 'İsim';
    case 'adj':
      return 'Sıfat';
    case 'adv':
      return 'Zarf';
    case 'conjunction':
      return 'Bağlaç';
    default:
      return 'Kelime';
  }
}

export function getCefrBandLabel(band: CefrBand): string {
  if (band === 'a1-a2') return 'A1–A2';
  return 'B1–B2';
}

function isHeavyTopicText(text?: string): boolean {
  if (!text) return false;
  return HEAVY_KEYWORD_REGEX.test(text);
}

/**
 * Classifies any dictionary WordEntry into strict CEFR bands (a1-a2, b1-b2),
 * ensuring heavy academic, economic, environmental, or research content NEVER leaks into A1-A2.
 */
export function classifyWordCefrBand(word: WordEntry): CefrBand {
  const key = word.word.toLowerCase().trim();
  const level = word.cefrLevel;

  if (ACADEMIC_B1_B2_WORD_SET.has(key)) {
    return 'b1-b2';
  }

  if (level === 'B1' || level === 'B2') {
    return 'b1-b2';
  }

  // A1 or A2 tagged entry: verify it isn't actually heavy academic/economic/climate content
  if (level === 'A1' || level === 'A2') {
    if (isHeavyTopicText(word.word) || isHeavyTopicText(word.enExample)) {
      return 'b1-b2';
    }
    return 'a1-a2';
  }

  return 'b1-b2';
}

function extractMeaningTokens(trMeaning?: string): Set<string> {
  if (!trMeaning) return new Set();
  const cleaned = trMeaning
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[.;!?]/g, ',');
  const clauses = cleaned
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
  return new Set(clauses);
}

function hasMeaningOverlap(a: WordEntry, b: WordEntry): boolean {
  const tokensA = extractMeaningTokens(a.trMeaning);
  const tokensB = extractMeaningTokens(b.trMeaning);
  for (const t of tokensA) {
    if (tokensB.has(t)) return true;
  }
  return false;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolves an elementary word into a WordEntry: reuses the live entry from `words` if present,
 * otherwise builds a clean stable `elem_<word>` WordEntry so it can be added to Defterim cleanly.
 */
function buildElementaryEntryMap(words: WordEntry[]): Map<string, WordEntry> {
  const liveByWord = new Map<string, WordEntry>();
  for (const w of words) {
    liveByWord.set(w.word.toLowerCase().trim(), w);
  }

  const elemMap = new Map<string, WordEntry>();
  for (const seed of ELEMENTARY_WORD_SEEDS) {
    const key = seed.word.toLowerCase();
    const existing = liveByWord.get(key);
    const fullPos: PartOfSpeech = seed.pos === 'adj' ? 'adjective' : seed.pos === 'adv' ? 'adverb' : seed.pos;

    if (existing) {
      // Keep live entry ID & favorite state, while preserving clean elementary example & meaning if needed
      elemMap.set(key, {
        ...existing,
        cefrLevel: seed.level,
        trMeaning: existing.trMeaning || seed.tr,
        enExample: seed.enEx,
        trExample: seed.trEx,
      });
    } else {
      elemMap.set(key, {
        id: `elem_${key.replace(/\s+/g, '_')}`,
        word: seed.word,
        phonetic: `/${seed.word}/`,
        partOfSpeech: fullPos,
        type: seed.pos,
        cefrLevel: seed.level,
        level: seed.level,
        trMeaning: seed.tr,
        meaning: seed.tr,
        enExample: seed.enEx,
        exampleEn: seed.enEx,
        trExample: seed.trEx,
        exampleTr: seed.trEx,
        isFavorite: false,
        status: 'calisiliyor',
      });
    }
  }
  return elemMap;
}

function pickDistractorsInPool(
  target: WordEntry,
  candidatePool: WordEntry[],
  excludedWordKeys: Set<string>,
  needed = 4
): WordEntry[] {
  const targetPos = normalizePosGroup(target.partOfSpeech || target.type);
  const samePos = shuffleArray(
    candidatePool.filter((w) => {
      const key = w.word.toLowerCase().trim();
      if (excludedWordKeys.has(key)) return false;
      if (normalizePosGroup(w.partOfSpeech || w.type) !== targetPos) return false;
      if (!w.trMeaning || w.trMeaning.trim().length < 2) return false;
      if (hasMeaningOverlap(target, w)) return false;
      return true;
    })
  );

  const selected: WordEntry[] = [];
  const usedKeys = new Set(excludedWordKeys);

  for (const candidate of samePos) {
    if (selected.length >= needed) break;
    const key = candidate.word.toLowerCase().trim();
    if (usedKeys.has(key)) continue;
    if (selected.some((existing) => hasMeaningOverlap(existing, candidate))) continue;
    selected.push(candidate);
    usedKeys.add(key);
  }

  return selected;
}

/**
 * Common English irregular inflections (verbs, nouns, adjectives) so example sentences using
 * past/participle/plural/comparative forms match and hide the target word cleanly.
 */
const IRREGULAR_WORD_FORMS: Record<string, string[]> = {
  arise: ['arose', 'arisen', 'arising', 'arises'],
  awake: ['awoke', 'awoken', 'awaking', 'awakes'],
  bad: ['worse', 'worst'],
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  bear: ['bore', 'borne', 'born', 'bearing', 'bears'],
  beat: ['beaten', 'beating', 'beats'],
  become: ['became', 'becoming', 'becomes'],
  begin: ['began', 'begun', 'beginning', 'begins'],
  bend: ['bent', 'bending', 'bends'],
  bite: ['bit', 'bitten', 'biting', 'bites'],
  blow: ['blew', 'blown', 'blowing', 'blows'],
  break: ['broke', 'broken', 'breaking', 'breaks'],
  bring: ['brought', 'bringing', 'brings'],
  build: ['built', 'building', 'builds'],
  burn: ['burnt', 'burned', 'burning', 'burns'],
  buy: ['bought', 'buying', 'buys'],
  catch: ['caught', 'catching', 'catches'],
  child: ['children'],
  choose: ['chose', 'chosen', 'choosing', 'chooses'],
  come: ['came', 'coming', 'comes'],
  cost: ['costing', 'costs'],
  cut: ['cutting', 'cuts'],
  deal: ['dealt', 'dealing', 'deals'],
  dig: ['dug', 'digging', 'digs'],
  do: ['does', 'did', 'done', 'doing'],
  draw: ['drew', 'drawn', 'drawing', 'draws'],
  dream: ['dreamt', 'dreamed', 'dreaming', 'dreams'],
  drink: ['drank', 'drunk', 'drinking', 'drinks'],
  drive: ['drove', 'driven', 'driving', 'drives'],
  eat: ['ate', 'eaten', 'eating', 'eats'],
  fall: ['fell', 'fallen', 'falling', 'falls'],
  far: ['farther', 'farthest', 'further', 'furthest'],
  feed: ['fed', 'feeding', 'feeds'],
  feel: ['felt', 'feeling', 'feels'],
  fight: ['fought', 'fighting', 'fights'],
  find: ['found', 'finding', 'finds'],
  fly: ['flew', 'flown', 'flying', 'flies'],
  foot: ['feet'],
  forbid: ['forbade', 'forbidden', 'forbidding', 'forbids'],
  forget: ['forgot', 'forgotten', 'forgetting', 'forgets'],
  forgive: ['forgave', 'forgiven', 'forgiving', 'forgives'],
  freeze: ['froze', 'frozen', 'freezing', 'freezes'],
  get: ['got', 'gotten', 'getting', 'gets'],
  give: ['gave', 'given', 'giving', 'gives'],
  go: ['goes', 'went', 'gone', 'going'],
  good: ['better', 'best'],
  grow: ['grew', 'grown', 'growing', 'grows'],
  hang: ['hung', 'hanged', 'hanging', 'hangs'],
  have: ['has', 'had', 'having'],
  hear: ['heard', 'hearing', 'hears'],
  hide: ['hid', 'hidden', 'hiding', 'hides'],
  hit: ['hitting', 'hits'],
  hold: ['held', 'holding', 'holds'],
  hurt: ['hurting', 'hurts'],
  keep: ['kept', 'keeping', 'keeps'],
  know: ['knew', 'known', 'knowing', 'knows'],
  lay: ['laid', 'laying', 'lays'],
  lead: ['led', 'leading', 'leads'],
  leaf: ['leaves'],
  learn: ['learnt', 'learned', 'learning', 'learns'],
  leave: ['left', 'leaving', 'leaves'],
  lend: ['lent', 'lending', 'lends'],
  let: ['letting', 'lets'],
  lie: ['lay', 'lain', 'lying', 'lied', 'lies'],
  life: ['lives'],
  light: ['lit', 'lighted', 'lighting', 'lights'],
  lose: ['lost', 'losing', 'loses'],
  make: ['made', 'making', 'makes'],
  man: ['men'],
  mean: ['meant', 'meaning', 'means'],
  meet: ['met', 'meeting', 'meets'],
  mouse: ['mice'],
  overcome: ['overcame', 'overcoming', 'overcomes'],
  pay: ['paid', 'paying', 'pays'],
  person: ['people', 'persons'],
  prove: ['proved', 'proven', 'proving', 'proves'],
  put: ['putting', 'puts'],
  read: ['reading', 'reads'],
  ride: ['rode', 'ridden', 'riding', 'rides'],
  ring: ['rang', 'rung', 'ringing', 'rings'],
  rise: ['rose', 'risen', 'rising', 'rises'],
  run: ['ran', 'running', 'runs'],
  say: ['said', 'saying', 'says'],
  see: ['saw', 'seen', 'seeing', 'sees'],
  seek: ['sought', 'seeking', 'seeks'],
  sell: ['sold', 'selling', 'sells'],
  send: ['sent', 'sending', 'sends'],
  set: ['setting', 'sets'],
  shake: ['shook', 'shaken', 'shaking', 'shakes'],
  shine: ['shone', 'shined', 'shining', 'shines'],
  shoot: ['shot', 'shooting', 'shoots'],
  show: ['showed', 'shown', 'showing', 'shows'],
  shut: ['shutting', 'shuts'],
  sing: ['sang', 'sung', 'singing', 'sings'],
  sink: ['sank', 'sunk', 'sinking', 'sinks'],
  sit: ['sat', 'sitting', 'sits'],
  sleep: ['slept', 'sleeping', 'sleeps'],
  slide: ['slid', 'sliding', 'slides'],
  speak: ['spoke', 'spoken', 'speaking', 'speaks'],
  spend: ['spent', 'spending', 'spends'],
  spread: ['spreading', 'spreads'],
  stand: ['stood', 'standing', 'stands'],
  steal: ['stole', 'stolen', 'stealing', 'steals'],
  stick: ['stuck', 'sticking', 'sticks'],
  strike: ['struck', 'striking', 'strikes'],
  strive: ['strove', 'striven', 'striving', 'strives'],
  swear: ['swore', 'sworn', 'swearing', 'swears'],
  sweep: ['swept', 'sweeping', 'sweeps'],
  swim: ['swam', 'swum', 'swimming', 'swims'],
  take: ['took', 'taken', 'taking', 'takes'],
  teach: ['taught', 'teaching', 'teaches'],
  tear: ['tore', 'torn', 'tearing', 'tears'],
  tell: ['told', 'telling', 'tells'],
  think: ['thought', 'thinking', 'thinks'],
  throw: ['threw', 'thrown', 'throwing', 'throws'],
  tooth: ['teeth'],
  undergo: ['underwent', 'undergone', 'undergoing', 'undergoes'],
  understand: ['understood', 'understanding', 'understands'],
  undertake: ['undertook', 'undertaken', 'undertaking', 'undertakes'],
  wake: ['woke', 'woken', 'waking', 'wakes'],
  wear: ['wore', 'worn', 'wearing', 'wears'],
  wife: ['wives'],
  win: ['won', 'winning', 'wins'],
  withdraw: ['withdrew', 'withdrawn', 'withdrawing', 'withdraws'],
  woman: ['women'],
  write: ['wrote', 'written', 'writing', 'writes'],
};

function buildTokenInflectionForms(rawToken: string): string[] {
  const token = rawToken.toLowerCase().trim();
  if (!token) return [];
  const forms = new Set<string>([token]);

  const irregulars = IRREGULAR_WORD_FORMS[token];
  if (irregulars) {
    for (const form of irregulars) forms.add(form);
  }

  // Regular plural / verb / comparative / adverb suffixes
  forms.add(`${token}s`);
  forms.add(`${token}es`);
  forms.add(`${token}ed`);
  forms.add(`${token}d`);
  forms.add(`${token}ing`);
  forms.add(`${token}er`);
  forms.add(`${token}est`);
  forms.add(`${token}ly`);

  // Silent 'e' drop (make -> making, decide -> decided, large -> larger, simple -> simply)
  if (token.endsWith('e') && token.length > 2) {
    const stem = token.slice(0, -1);
    forms.add(`${stem}ing`);
    forms.add(`${stem}ed`);
    forms.add(`${stem}er`);
    forms.add(`${stem}est`);
    forms.add(`${stem}y`);
    if (token.endsWith('le') && token.length > 3) {
      forms.add(`${stem}y`);
    }
    if (token.endsWith('ue') && token.length > 3) {
      forms.add(`${stem}ly`);
    }
  }

  // 'ie' -> 'ying' (die -> dying, tie -> tying)
  if (token.endsWith('ie') && token.length > 2) {
    forms.add(`${token.slice(0, -2)}ying`);
  }

  // Consonant + 'y' -> 'i' + suffix (study -> studies/studied, happy -> happier/happiest/happily)
  if (token.endsWith('y') && token.length > 2 && !/[aeiou]y$/.test(token)) {
    const stem = token.slice(0, -1);
    forms.add(`${stem}ies`);
    forms.add(`${stem}ied`);
    forms.add(`${stem}ier`);
    forms.add(`${stem}iest`);
    forms.add(`${stem}ily`);
  }

  // 'f'/'fe' -> 'ves' (wolf -> wolves, shelf -> shelves)
  if (token.endsWith('f') && token.length > 2) {
    forms.add(`${token.slice(0, -1)}ves`);
  } else if (token.endsWith('fe') && token.length > 3) {
    forms.add(`${token.slice(0, -2)}ves`);
  }

  // 'c' -> 'ck' (panic -> panicked/panicking)
  if (token.endsWith('c') && token.length > 2) {
    forms.add(`${token}ked`);
    forms.add(`${token}king`);
  }

  // Doubled final consonant (stop -> stopped/stopping, big -> bigger/biggest, travel -> travelled, occur -> occurred)
  if (token.length >= 3 && /[aeiou][bcdfghlmnprstvz]$/.test(token)) {
    const lastChar = token[token.length - 1];
    forms.add(`${token}${lastChar}ed`);
    forms.add(`${token}${lastChar}ing`);
    forms.add(`${token}${lastChar}er`);
    forms.add(`${token}${lastChar}est`);
  }

  // Longer forms first so regex prefers full inflected tokens over base substrings
  return Array.from(forms).sort((a, b) => b.length - a.length);
}

/**
 * Finds the target word (or any of its inflected/suffixed forms) inside an English example sentence,
 * case-insensitively with word boundaries. Supports both single words and multi-word expressions/phrasal verbs.
 */
function findWordMatchInSentence(
  rawWord: string,
  sentence: string
): { index: number; length: number; matchedText: string } | null {
  const cleaned = rawWord.trim();
  if (!cleaned || !sentence) return null;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  if (tokens.length === 1) {
    const candidates = buildTokenInflectionForms(tokens[0]).map(escapeRegExp);
    const regex = new RegExp(`\\b(?:${candidates.join('|')})\\b`, 'i');
    const match = regex.exec(sentence);
    if (!match) return null;
    return {
      index: match.index,
      length: match[0].length,
      matchedText: match[0],
    };
  }

  // Multi-word phrase / phrasal verb: allow inflections on the first token (e.g., "carry out" -> "carried out")
  const firstVariants = buildTokenInflectionForms(tokens[0]).map(escapeRegExp);
  const restPattern = tokens.slice(1).map(escapeRegExp).join('\\s+');
  const phraseRegex = new RegExp(
    `\\b(?:${firstVariants.join('|')})\\s+${restPattern}\\b`,
    'i'
  );
  const match = phraseRegex.exec(sentence);
  if (!match) return null;
  return {
    index: match.index,
    length: match[0].length,
    matchedText: match[0],
  };
}

/**
 * Picks 4 unique random distractors for Multiple Choice:
 * 1. First selects from words in the SAME CEFR band and SAME Part of Speech (without meaning overlap).
 * 2. If fewer than 4 exist in that exact POS, tops up randomly from other words in the SAME CEFR band
 *    so every question always has 5 distinct options (A-E).
 */
function pickMcDistractors(
  target: WordEntry,
  sameBandPool: WordEntry[],
  excludedWordKeys: Set<string>,
  needed = 4
): WordEntry[] {
  const targetPos = normalizePosGroup(target.partOfSpeech || target.type);
  const usedKeys = new Set<string>(excludedWordKeys);
  const selected: WordEntry[] = [];

  const tryPickFrom = (candidates: WordEntry[], checkMeaningOverlap: boolean) => {
    for (const candidate of shuffleArray(candidates)) {
      if (selected.length >= needed) break;
      const key = candidate.word.toLowerCase().trim();
      if (!key || usedKeys.has(key)) continue;
      if (!candidate.trMeaning || candidate.trMeaning.trim().length < 2) continue;
      if (checkMeaningOverlap) {
        if (hasMeaningOverlap(target, candidate)) continue;
        if (selected.some((existing) => hasMeaningOverlap(existing, candidate))) continue;
      }
      selected.push(candidate);
      usedKeys.add(key);
    }
  };

  // Pass 1: Same CEFR level + Same Part of Speech (clean non-overlapping meaning)
  const samePosCandidates = sameBandPool.filter(
    (w) => normalizePosGroup(w.partOfSpeech || w.type) === targetPos
  );
  tryPickFrom(samePosCandidates, true);

  // Pass 2: Same CEFR level + other Parts of Speech (if same POS had < 4 distractors)
  if (selected.length < needed) {
    const otherPosCandidates = sameBandPool.filter(
      (w) => normalizePosGroup(w.partOfSpeech || w.type) !== targetPos
    );
    tryPickFrom(otherPosCandidates, true);
  }

  // Pass 3: Same CEFR level relaxed overlap guard (guarantees 4 distractors if pool is tiny)
  if (selected.length < needed) {
    tryPickFrom(sameBandPool, false);
  }

  return selected;
}

/**
 * Dynamically generates 5-option (A-E) Multiple Choice questions strictly from words in the live
 * database that contain an English example sentence.
 * - Matches & blanks the target word case-insensitively including inflected/suffixed forms.
 * - Strictly excludes words without an English example sentence.
 * - Picks 4 same-level & same-POS distractors (with same-level fallback) and shuffles options with Fisher-Yates.
 * - Shuffles candidate pool with Fisher-Yates and avoids repeating words solved in the current session.
 */
export function generateMultipleChoiceQuiz(
  words: WordEntry[],
  levelFilter: ExerciseLevelFilter = 'all',
  count = 10,
  sessionSolvedWordKeys?: Set<string>
): MultipleChoiceQuestion[] {
  interface EligibleMcCandidate {
    wordEntry: WordEntry;
    band: CefrBand;
    sentence: string;
    match: { index: number; length: number; matchedText: string };
  }

  // Deduplicate words by lowercase key and partition ALL database words by CEFR band for distractors
  const allBandWords: Record<CefrBand, WordEntry[]> = {
    'a1-a2': [],
    'b1-b2': [],
  };
  const eligibleByBand: Record<CefrBand, EligibleMcCandidate[]> = {
    'a1-a2': [],
    'b1-b2': [],
  };

  const seenPoolKeys = new Set<string>();
  for (const w of words) {
    const rawWord = w.word?.trim();
    if (!rawWord) continue;
    const key = rawWord.toLowerCase();
    if (seenPoolKeys.has(key)) continue;
    seenPoolKeys.add(key);

    const band = classifyWordCefrBand(w);
    allBandWords[band].push(w);

    // Strictly exclude words that have no English example sentence or no Turkish meaning
    const sentence = (w.enExample || w.exampleEn || '').trim();
    if (!sentence || !w.trMeaning || w.trMeaning.trim().length < 2) continue;

    const match = findWordMatchInSentence(rawWord, sentence);
    if (!match) continue;

    eligibleByBand[band].push({
      wordEntry: w,
      band,
      sentence,
      match,
    });
  }

  const buildQuestionsForBand = (band: CefrBand, limit: number): MultipleChoiceQuestion[] => {
    const bandCandidates = eligibleByBand[band];
    if (bandCandidates.length === 0 || limit <= 0) return [];

    // Prioritize words NOT yet solved in this session (Fisher-Yates shuffled)
    const unseenCandidates = shuffleArray(
      bandCandidates.filter(
        (c) => !sessionSolvedWordKeys?.has(c.wordEntry.word.toLowerCase().trim())
      )
    );
    // Only fall back to previously solved words if unseen pool cannot fill the requested count
    const seenFallbackCandidates =
      unseenCandidates.length < limit
        ? shuffleArray(
            bandCandidates.filter((c) =>
              sessionSolvedWordKeys?.has(c.wordEntry.word.toLowerCase().trim())
            )
          )
        : [];

    const orderedCandidates = [...unseenCandidates, ...seenFallbackCandidates];
    const sameBandDistractorPool = allBandWords[band];
    const results: MultipleChoiceQuestion[] = [];
    const usedTargetKeys = new Set<string>();

    for (const item of orderedCandidates) {
      if (results.length >= limit) break;
      const target = item.wordEntry;
      const targetKey = target.word.toLowerCase().trim();
      if (usedTargetKeys.has(targetKey)) continue;

      const excluded = new Set<string>([targetKey]);
      const distractors = pickMcDistractors(target, sameBandDistractorPool, excluded, 4);
      if (distractors.length < 4) continue;

      const sentenceBefore = item.sentence.slice(0, item.match.index);
      const sentenceAfter = item.sentence.slice(item.match.index + item.match.length);
      const isSentenceStart = sentenceBefore.trim().length === 0;

      const rawOptions = shuffleArray([target, ...distractors.slice(0, 4)]);
      const options: QuizOption[] = rawOptions.map((entry, idx) => ({
        letter: OPTION_LETTERS[idx],
        text: isSentenceStart
          ? entry.word.charAt(0).toUpperCase() + entry.word.slice(1)
          : entry.word,
        wordEntry: entry,
      }));

      const correctOption = options.find((o) => o.wordEntry.id === target.id);
      if (!correctOption) continue;

      const posTr = getPosTurkishName(target.partOfSpeech || target.type);
      const displayCefr: CefrLevel =
        band === 'a1-a2'
          ? target.cefrLevel === 'A1' || target.cefrLevel === 'A2'
            ? target.cefrLevel
            : 'A2'
          : target.cefrLevel === 'B1' || target.cefrLevel === 'B2'
          ? target.cefrLevel
          : 'B2';

      usedTargetKeys.add(targetKey);
      results.push({
        id: `mc_${band}_${target.id}_${results.length}`,
        cefrBand: band,
        cefrLabel: displayCefr,
        sentenceBefore,
        sentenceAfter,
        matchedText: item.match.matchedText,
        fullSentenceEn: item.sentence,
        fullSentenceTr: (target.trExample || target.exampleTr || '').trim(),
        targetWord: target,
        options,
        correctLetter: correctOption.letter,
        explanationTr: `"${target.word}" (${posTr}, ${displayCefr}) "${target.trMeaning}" anlamına gelir.`,
        examTip: target.academicNote || target.prepExamTip || undefined,
      });
    }

    return shuffleArray(results);
  };

  if (levelFilter === 'a1-a2') {
    return shuffleArray(buildQuestionsForBand('a1-a2', count));
  }
  if (levelFilter === 'b1-b2') {
    return shuffleArray(buildQuestionsForBand('b1-b2', count));
  }

  // 'all': Balanced mix of A1-A2 (4) and B1-B2 (6), filling from the other band if one is short
  const a12Questions = buildQuestionsForBand('a1-a2', Math.min(4, count));
  const b12Questions = buildQuestionsForBand('b1-b2', Math.max(0, count - a12Questions.length));
  const combined = [...a12Questions, ...b12Questions];

  if (combined.length < count) {
    const existingKeys = new Set(combined.map((q) => q.targetWord.word.toLowerCase().trim()));
    const combinedExcluded = new Set<string>([
      ...(sessionSolvedWordKeys ? Array.from(sessionSolvedWordKeys) : []),
      ...Array.from(existingKeys),
    ]);
    const extraA12 = buildQuestionsForBand('a1-a2', count - combined.length).filter(
      (q) => !combinedExcluded.has(q.targetWord.word.toLowerCase().trim())
    );
    combined.push(...extraA12);
  }

  return shuffleArray(combined).slice(0, count);
}

/**
 * Returns strictly the Cloze Test passages matching the active CEFR filter.
 */
export function getClozePassagesForFilter(
  levelFilter: ExerciseLevelFilter
): RawClozePassage[] {
  if (levelFilter === 'a1-a2') {
    return CLOZE_PASSAGES.filter((p) => p.cefrBand === 'a1-a2');
  }
  if (levelFilter === 'b1-b2') {
    return CLOZE_PASSAGES.filter((p) => p.cefrBand === 'b1-b2');
  }
  return CLOZE_PASSAGES;
}

/**
 * Returns the strictly CEFR-filtered Cloze Test passages shuffled via Fisher-Yates.
 * When `avoidFirstId` is provided and the pool has 2+ passages, guarantees the first
 * passage is different from `avoidFirstId` so consecutive plays never repeat.
 */
export function getShuffledClozePassagesForFilter(
  levelFilter: ExerciseLevelFilter,
  avoidFirstId?: string
): RawClozePassage[] {
  const shuffled = shuffleArray(getClozePassagesForFilter(levelFilter));
  if (avoidFirstId && shuffled.length > 1 && shuffled[0].id === avoidFirstId) {
    const swapIdx = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[0]];
  }
  return shuffled;
}

/**
 * Builds a complete 5-blank Cloze Test session strictly within the selected level filter.
 * Accepts an optional pre-shuffled passage list so UI switching and random selection stay in sync.
 */
export function buildClozeTestSession(
  words: WordEntry[],
  levelFilter: ExerciseLevelFilter,
  passageIndexInFilter: number,
  customPassages?: RawClozePassage[]
): ClozeTestSession | null {
  const availablePassages =
    customPassages && customPassages.length > 0
      ? customPassages
      : getShuffledClozePassagesForFilter(levelFilter);
  if (availablePassages.length === 0) return null;

  const safeIndex =
    ((passageIndexInFilter % availablePassages.length) + availablePassages.length) %
    availablePassages.length;
  const raw = availablePassages[safeIndex];

  const wordMap = new Map<string, WordEntry>();
  for (const w of words) {
    wordMap.set(w.word.toLowerCase().trim(), w);
  }
  const elemMap = buildElementaryEntryMap(words);
  const elemList = Array.from(elemMap.values());

  // Distractor pool strictly respects passage CEFR band
  const bandDistractorPool =
    raw.cefrBand === 'a1-a2'
      ? elemList
      : words.filter((w) => classifyWordCefrBand(w) === 'b1-b2');

  const segments = raw.template.split(/\{\{\d+\}\}/g);
  const blanks: ClozeBlankQuestion[] = raw.blanks.map((blankDef) => {
    const lowerWord = blankDef.word.toLowerCase();
    const elemEntry = elemMap.get(lowerWord);
    const dictEntry = wordMap.get(lowerWord);

    const targetWord: WordEntry =
      raw.cefrBand === 'a1-a2' && elemEntry
        ? elemEntry
        : dictEntry ||
          elemEntry || {
            id: `cloze_${raw.id}_${blankDef.blankNumber}`,
            word: blankDef.word,
            partOfSpeech: blankDef.pos,
            cefrLevel: (raw.cefrBand === 'a1-a2' ? 'A1' : 'B2') as CefrLevel,
            trMeaning: blankDef.contextHintTr,
            enExample: '',
            trExample: '',
          };

    const excluded = new Set<string>(raw.blanks.map((b) => b.word.toLowerCase()));
    let distractors: WordEntry[] = [];

    if (blankDef.explicitDistractors && blankDef.explicitDistractors.length > 0) {
      for (const dWord of blankDef.explicitDistractors) {
        const found = elemMap.get(dWord.toLowerCase()) || wordMap.get(dWord.toLowerCase());
        if (found && !excluded.has(found.word.toLowerCase())) {
          distractors.push(found);
          excluded.add(found.word.toLowerCase());
        }
      }
    }

    if (distractors.length < 4) {
      const extra = pickDistractorsInPool(targetWord, bandDistractorPool, excluded, 4 - distractors.length);
      distractors = [...distractors, ...extra];
    }

    const prevSegment = segments[blankDef.blankNumber - 1] || '';
    const trimmedPrev = prevSegment.trimEnd();
    const isSentenceStart = trimmedPrev.length === 0 || /[.!?]$/.test(trimmedPrev);

    const rawOptions = shuffleArray([targetWord, ...distractors.slice(0, 4)]);
    const options: QuizOption[] = rawOptions.map((entry, idx) => ({
      letter: OPTION_LETTERS[idx],
      text: isSentenceStart
        ? entry.word.charAt(0).toUpperCase() + entry.word.slice(1)
        : entry.word,
      wordEntry: entry,
    }));

    const correctOption = options.find(
      (o) => o.wordEntry.word.toLowerCase() === targetWord.word.toLowerCase()
    )!;
    const posTr = getPosTurkishName(targetWord.partOfSpeech || targetWord.type);
    const explanationTr = `"${targetWord.word}" (${posTr}) "${targetWord.trMeaning}" anlamına gelir. ${blankDef.contextHintTr}`;

    return {
      blankNumber: blankDef.blankNumber,
      targetWord,
      options,
      correctLetter: correctOption.letter,
      contextHintTr: blankDef.contextHintTr,
      explanationTr,
      examTip:
        raw.cefrBand !== 'a1-a2'
          ? targetWord.academicNote || targetWord.prepExamTip || undefined
          : undefined,
    };
  });

  return {
    passageId: raw.id,
    passageIndex: safeIndex,
    totalPassagesInFilter: availablePassages.length,
    cefrBand: raw.cefrBand,
    titleTr: raw.titleTr,
    topicTr: raw.topicTr,
    cefrBadge: raw.cefrBadge,
    segments,
    blanks,
    passageSummaryTr: raw.passageSummaryTr,
  };
}

/**
 * Generates strictly CEFR-filtered 5-option (A–E) Synonym matching questions.
 * - 'a1-a2': ONLY elementary pairs (happy-glad, big-large, start-begin, fast-quick...) with A1-A2 distractors.
 * - 'b1-b2': ONLY B1-B2 university-prep & academic pairs with B1-B2 distractors.
 * - 'all': Balanced mix of A1-A2 and B1-B2 bands.
 */
export function generateSynonymQuiz(
  words: WordEntry[],
  levelFilter: ExerciseLevelFilter = 'all',
  count = 10,
  recentWordKeys?: Set<string>
): SynonymQuestion[] {
  const wordMap = new Map<string, WordEntry>();
  for (const w of words) {
    wordMap.set(w.word.toLowerCase().trim(), w);
  }
  const elemMap = buildElementaryEntryMap(words);
  const elemList = Array.from(elemMap.values());

  // Build global known synonym lookup so a true synonym is never picked as a distractor
  const knownSynonymMap = new Map<string, Set<string>>();
  for (const [a, b] of [...A1_A2_SYNONYM_PAIRS, ...B1_B2_SYNONYM_PAIRS]) {
    if (!knownSynonymMap.has(a)) knownSynonymMap.set(a, new Set());
    if (!knownSynonymMap.has(b)) knownSynonymMap.set(b, new Set());
    knownSynonymMap.get(a)!.add(b);
    knownSynonymMap.get(b)!.add(a);
  }

  const buildPairsForBand = (band: CefrBand, limit: number): SynonymQuestion[] => {
    const rawPairs = band === 'a1-a2' ? A1_A2_SYNONYM_PAIRS : B1_B2_SYNONYM_PAIRS;

    const distractorPool =
      band === 'a1-a2'
        ? elemList
        : words.filter((w) => classifyWordCefrBand(w) === 'b1-b2');

    const freshPairs = shuffleArray(
      rawPairs.filter(
        ([a, b]) => !recentWordKeys?.has(a.toLowerCase()) && !recentWordKeys?.has(b.toLowerCase())
      )
    );
    const repeatPairs = shuffleArray(
      rawPairs.filter(
        ([a, b]) => recentWordKeys?.has(a.toLowerCase()) || recentWordKeys?.has(b.toLowerCase())
      )
    );

    const results: SynonymQuestion[] = [];
    const usedWordKeys = new Set<string>();

    for (const [wordA, wordB] of [...freshPairs, ...repeatPairs]) {
      if (results.length >= limit) break;

      const entryA = band === 'a1-a2' ? elemMap.get(wordA) : wordMap.get(wordA);
      const entryB = band === 'a1-a2' ? elemMap.get(wordB) : wordMap.get(wordB);
      if (!entryA || !entryB) continue;

      if (usedWordKeys.has(wordA) || usedWordKeys.has(wordB)) continue;

      const flip = Math.random() < 0.5;
      const prompt = flip ? entryB : entryA;
      const synonym = flip ? entryA : entryB;

      const excluded = new Set<string>([
        prompt.word.toLowerCase(),
        synonym.word.toLowerCase(),
        ...(knownSynonymMap.get(prompt.word.toLowerCase()) || []),
        ...(knownSynonymMap.get(synonym.word.toLowerCase()) || []),
      ]);

      const distractors = pickDistractorsInPool(synonym, distractorPool, excluded, 4).filter(
        (d) => !hasMeaningOverlap(prompt, d) && !hasMeaningOverlap(synonym, d)
      );
      if (distractors.length < 4) continue;

      const rawOptions = shuffleArray([synonym, ...distractors]);
      const options: QuizOption[] = rawOptions.map((entry, idx) => ({
        letter: OPTION_LETTERS[idx],
        text: entry.word,
        wordEntry: entry,
      }));
      const correctOption = options.find((o) => o.wordEntry.id === synonym.id)!;
      const cefrLabel = band === 'a1-a2' ? prompt.cefrLevel : prompt.cefrLevel === 'B1' || prompt.cefrLevel === 'B2' ? prompt.cefrLevel : 'B2';

      usedWordKeys.add(wordA);
      usedWordKeys.add(wordB);

      results.push({
        id: `syn_${band}_${prompt.id}_${results.length}`,
        cefrBand: band,
        cefrLabel,
        promptWord: prompt,
        correctSynonym: synonym,
        options,
        correctLetter: correctOption.letter,
        explanationTr: `"${prompt.word}" (${prompt.trMeaning}) ile "${synonym.word}" (${synonym.trMeaning}) eş anlamlıdır.`,
        contextSentenceEn: prompt.enExample || undefined,
        contextSentenceTr: prompt.trExample || undefined,
      });
    }

    return shuffleArray(results);
  };

  if (levelFilter === 'a1-a2') {
    return shuffleArray(buildPairsForBand('a1-a2', count));
  }
  if (levelFilter === 'b1-b2') {
    return shuffleArray(buildPairsForBand('b1-b2', count));
  }

  // 'all': Balanced mix of A1-A2 (4) and B1-B2 (6)
  const mixed = [
    ...buildPairsForBand('a1-a2', 4),
    ...buildPairsForBand('b1-b2', 6),
  ];
  return shuffleArray(mixed).slice(0, count);
}
