import { WordEntry, PartOfSpeech, CefrLevel } from '../types';
import rawWords from './dictionaryData.json';

// Build a fast O(1) set of existing 2,500 core words from dictionaryData.json
const coreWordsSet = new Set<string>();
for (const entry of (rawWords as any[])) {
  if (entry && entry.word) {
    coreWordsSet.add(entry.word.toLowerCase().trim());
  }
}

interface RawEssentialItem {
  word: string;
  meaning: string;
  partOfSpeech: PartOfSpeech;
  cefrLevel: CefrLevel;
  exampleEn: string;
  exampleTr: string;
  prepExamTip?: string;
  collocations?: string[];
}

/**
 * Essential Missing A1–B2 Everyday & Academic Vocabulary.
 * Guaranteed instant, synchronous fallback patch for high-frequency vocabulary.
 */
const RAW_ESSENTIAL_ITEMS: RawEssentialItem[] = [
  // 1. High-frequency target: flat
  {
    word: 'flat',
    meaning: 'daire (apartman dairesi); düz, yassı',
    partOfSpeech: 'noun',
    cefrLevel: 'A1',
    exampleEn: 'They rent a furnished flat in the city centre close to campus.',
    exampleTr: 'Kampüse yakın şehir merkezinde eşyalı bir daire kiralıyorlar.',
    prepExamTip: "İngiliz İngilizcesinde 'apartman dairesi' anlamında en sık kullanılan sözcüktür (Amerikan İngilizcesi: apartment). Sıfat olarak 'düz, yassı' anlamına da gelir (flat surface).",
    collocations: ['two-bedroom flat', 'rent a flat', 'flat tire', 'flat surface']
  },

  // 2. Household & Everyday Items
  {
    word: 'dishwasher',
    meaning: 'bulaşık makinesi',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Please load the dirty plates into the dishwasher.',
    exampleTr: 'Lütfen kirli tabakları bulaşık makinesine yerleştirin.',
    prepExamTip: 'Günlük yaşam ve ev konulu A2-B1 okuma/dinleme sınavlarında sıkça geçer.',
    collocations: ['load the dishwasher', 'empty the dishwasher']
  },
  {
    word: 'blender',
    meaning: 'blender, karıştırıcı',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'She uses a blender to make fresh fruit smoothies every morning.',
    exampleTr: 'Her sabah taze meyveli smoothie yapmak için blender kullanır.',
    prepExamTip: 'Mutfak aletleri arasında yaygın bir günlük sözcüktür.'
  },
  {
    word: 'bookshelf',
    meaning: 'kitaplık, kitap rafı',
    partOfSpeech: 'noun',
    cefrLevel: 'A1',
    exampleEn: 'He placed the heavy academic dictionaries on the top bookshelf.',
    exampleTr: 'Ağır akademik sözlükleri en üstteki kitap rafına yerleştirdi.',
    prepExamTip: 'Çoğulu düzensizdir: bookshelves.'
  },
  {
    word: 'cushion',
    meaning: 'kırlent, koltuk minderi, yastık',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'There are several colourful cushions on the living room sofa.',
    exampleTr: 'Oturma odasındaki kanepede birkaç renkli kırlent var.',
    prepExamTip: "Yatakta baş altına konan yastık 'pillow', koltuktaki minder/kırlent ise 'cushion'dır."
  },
  {
    word: 'shampoo',
    meaning: 'şampuan; saç yıkamak',
    partOfSpeech: 'noun',
    cefrLevel: 'A1',
    exampleEn: 'He bought a bottle of herbal shampoo from the pharmacy.',
    exampleTr: 'Eczaneden bir şişe bitkisel şampuan satın aldı.'
  },
  {
    word: 'toothbrush',
    meaning: 'diş fırçası',
    partOfSpeech: 'noun',
    cefrLevel: 'A1',
    exampleEn: 'Dentists recommend changing your toothbrush every three months.',
    exampleTr: 'Diş hekimleri diş fırçanızı her üç ayda bir değiştirmenizi önerir.'
  },
  {
    word: 'toothpaste',
    meaning: 'diş macunu',
    partOfSpeech: 'noun',
    cefrLevel: 'A1',
    exampleEn: 'Put a pea-sized amount of toothpaste on your brush.',
    exampleTr: 'Fırçanıza bezelye büyüklüğünde diş macunu sıkın.'
  },
  {
    word: 'hairdryer',
    meaning: 'saç kurutma makinesi, fön makinesi',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Is there a hairdryer available in the hotel bathroom?',
    exampleTr: 'Otel banyosunda saç kurutma makinesi var mı?'
  },
  {
    word: 'mousepad',
    meaning: 'fare altlığı, mousepad',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'The ergonomic mousepad reduces strain during long study sessions.',
    exampleTr: 'Ergonomik mousepad, uzun ders çalışma seanslarında gerginliği azaltır.'
  },
  {
    word: 'webcam',
    meaning: 'web kamerası',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Please turn on your webcam during the online English seminar.',
    exampleTr: 'Lütfen çevrim içi İngilizce semineri sırasında web kameranızı açın.'
  },
  {
    word: 'projector',
    meaning: 'projeksiyon cihazı, yansıtıcı',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The professor connected his laptop to the classroom projector.',
    exampleTr: 'Profesör dizüstü bilgisayarını sınıftaki projeksiyon cihazına bağladı.'
  },
  {
    word: 'stapler',
    meaning: 'zımba',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'May I borrow your stapler to attach these assignment pages?',
    exampleTr: 'Bu ödev sayfalarını tutturmak için zımbanızı ödünç alabilir miyim?'
  },
  {
    word: 'highlighter',
    meaning: 'fosforlu kalem, vurgulayıcı',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Use a yellow highlighter to mark essential vocabulary in the text.',
    exampleTr: 'Metindeki önemli kelimeleri işaretlemek için sarı fosforlu kalem kullanın.'
  },
  {
    word: 'headphone',
    meaning: 'kulaklık (baş üstü)',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'She puts on noise-cancelling headphones to concentrate in the library.',
    exampleTr: 'Kütüphanede odaklanabilmek için gürültü önleyici kulaklık takar.'
  },
  {
    word: 'earphone',
    meaning: 'kulak içi kulaklık',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'He plugged his earphones in to listen to English podcasts while commuting.',
    exampleTr: 'Yolculuk ederken İngilizce podcast dinlemek için kulaklığını taktı.'
  },
  {
    word: 'earbuds',
    meaning: 'kablosuz kulak içi kulaklık',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Wireless earbuds are very practical for jogging and studying.',
    exampleTr: 'Kablosuz kulak içi kulaklıklar koşu ve ders çalışmak için çok pratiktir.'
  },
  {
    word: 'socket',
    meaning: 'priz, soket',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Are there any free electrical sockets near our library desk?',
    exampleTr: 'Kütüphane masamızın yakınında boş elektrik prizi var mı?'
  },
  {
    word: 'plug',
    meaning: 'fiş, priz ucu; prize takmak',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Remember to plug your phone in before going to sleep.',
    exampleTr: 'Uyumadan önce telefonunuzu prize takmayı unutmayın.'
  },
  {
    word: 'staircase',
    meaning: 'merdiven, merdiven boşluğu',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'We took the central staircase instead of waiting for the crowded elevator.',
    exampleTr: 'Kalabalık asansörü beklemek yerine ana merdiveni kullandık.'
  },
  {
    word: 'hallway',
    meaning: 'koridor, hol, antre',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Lockers are lined up along the dormitory hallway.',
    exampleTr: 'Dolaplar yurt koridoru boyunca dizilmiştir.'
  },
  {
    word: 'corridor',
    meaning: 'koridor, geçit',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Walk down this corridor and turn left for the faculty office.',
    exampleTr: 'Bu koridor boyunca yürüyün ve fakülte ofisi için sola dönün.'
  },
  {
    word: 'balcony',
    meaning: 'balkon',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Our shared flat has a small balcony overlooking the campus park.',
    exampleTr: 'Ortak dairemizin kampüs parkına bakan küçük bir balkonu var.'
  },
  {
    word: 'basement',
    meaning: 'bodrum kat, bodrum',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The campus laundry facilities are located in the basement.',
    exampleTr: 'Kampüs çamaşırhane olanakları bodrum katta yer almaktadır.'
  },
  {
    word: 'attic',
    meaning: 'tavan arası',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'They store old university textbooks in the attic.',
    exampleTr: 'Eski üniversite ders kitaplarını tavan arasında saklıyorlar.'
  },
  {
    word: 'flatmate',
    meaning: 'ev arkadaşı, daire arkadaşı',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'My flatmate and I share all household chores and utility bills.',
    exampleTr: 'Daire arkadaşım ve ben tüm ev işlerini ve faturaları paylaşıyoruz.'
  },
  {
    word: 'roommate',
    meaning: 'oda arkadaşı (yurt veya ev)',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Having a considerate roommate makes university life much easier.',
    exampleTr: 'Düşünceli bir oda arkadaşına sahip olmak üniversite hayatını çok kolaylaştırır.'
  },
  {
    word: 'landlord',
    meaning: 'ev sahibi (erkek)',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'We signed a one-year tenancy agreement with the landlord.',
    exampleTr: 'Ev sahibiyle bir yıllık kira sözleşmesi imzaladık.'
  },
  {
    word: 'landlady',
    meaning: 'ev sahibi kadın',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The landlady visited today to inspect the heating system.',
    exampleTr: 'Ev sahibi kadın bugün ısıtma sistemini kontrol etmek için uğradı.'
  },
  {
    word: 'tenant',
    meaning: 'kiracı',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Tenants are responsible for keeping the flat in good condition.',
    exampleTr: 'Kiracılar daireyi iyi durumda tutmaktan sorumludur.'
  },
  {
    word: 'groceries',
    meaning: 'market alışverişi, bakkaliye, erzak',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'We do our weekly groceries shopping every Saturday morning.',
    exampleTr: 'Haftalık market alışverişimizi her cumartesi sabahı yaparız.'
  },
  {
    word: 'cashier',
    meaning: 'kasiyer, veznedar',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'The friendly cashier handed me my receipt and change.',
    exampleTr: 'Güleryüzlü kasiyer fişimi ve para üstümü teslim etti.'
  },
  {
    word: 'checkout',
    meaning: 'kasa, ödeme noktası; otel çıkışı',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Self-service checkouts help save time during busy hours.',
    exampleTr: 'Self-servis kasalar yoğun saatlerde zaman kazandırır.'
  },
  {
    word: 'receipt',
    meaning: 'fiş, makbuz, fatura',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Keep your purchase receipt in case you want to return the product.',
    exampleTr: 'Ürünü iade etmek istemeniz ihtimaline karşı alışveriş fişinizi saklayın.'
  },
  {
    word: 'discount',
    meaning: 'indirim, tenzilat; indirim yapmak',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'University students receive a 20% discount on public transport tickets.',
    exampleTr: 'Üniversite öğrencileri toplu taşıma biletlerinde yüzde 20 indirim alır.'
  },
  {
    word: 'refund',
    meaning: 'para iadesi, geri ödeme; iade etmek',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The bookstore issued a full refund because the textbook was damaged.',
    exampleTr: 'Ders kitabı hasarlı olduğu için kitapçı tam para iadesi yaptı.'
  },
  {
    word: 'ironing board',
    meaning: 'ütü masası',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Fold the ironing board and put it back behind the door.',
    exampleTr: 'Ütü masasını katlayıp kapının arkasına geri koyun.'
  },
  {
    word: 'vacuum cleaner',
    meaning: 'elektrikli süpürge',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'The vacuum cleaner makes cleaning carpets fast and effortless.',
    exampleTr: 'Elektrikli süpürge halıları temizlemeyi hızlı ve zahmetsiz hale getirir.'
  },
  {
    word: 'broom',
    meaning: 'süpürge',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Use the broom to sweep the kitchen floor.',
    exampleTr: 'Mutfak zeminini süpürmek için süpürgeyi kullanın.'
  },
  {
    word: 'dustpan',
    meaning: 'faraş',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Sweep the dust directly into the dustpan.',
    exampleTr: 'Tozu doğrudan faraşa süpürün.'
  },
  {
    word: 'mop',
    meaning: 'paspas; paspaslamak',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'She mopped the bathroom tiles with disinfectant water.',
    exampleTr: 'Banyo fayanslarını dezenfektanlı suyla paspasladı.'
  },
  {
    word: 'sponge',
    meaning: 'sünger',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Wash the dishes using warm water and a clean sponge.',
    exampleTr: 'Bulaşıkları ılık su ve temiz bir sünger kullanarak yıkayın.'
  },
  {
    word: 'detergent',
    meaning: 'deterjan, temizlik maddesi',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Add eco-friendly laundry detergent to the washing machine.',
    exampleTr: 'Çamaşır makinesine çevre dostu çamaşır deterjanı ekleyin.'
  },
  {
    word: 'bleach',
    meaning: 'çamaşır suyu; beyazlatmak',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Do not mix bleach with other household cleaning chemicals.',
    exampleTr: 'Çamaşır suyunu diğer ev temizlik kimyasallarıyla karıştırmayın.'
  },
  {
    word: 'laundry',
    meaning: 'çamaşır, çamaşırhane',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'I need to do my laundry before classes start on Monday.',
    exampleTr: 'Pazartesi dersler başlamadan önce çamaşırlarımı yıkamam gerekiyor.'
  },

  // 3. Campus & Academic Vocabulary
  {
    word: 'syllabus',
    meaning: 'ders izlencesi, müfredat programı',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Please review the course syllabus for assignment deadlines and exam dates.',
    exampleTr: 'Ödev teslim tarihleri ve sınav günleri için lütfen ders izlencesini inceleyin.',
    prepExamTip: 'Hazırlık ve üniversite oryantasyonunda en kritik kelimedir. Çoğulu syllabi veya syllabuses şeklindedir.'
  },
  {
    word: 'cafeteria',
    meaning: 'kafeterya, yemekhane',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Students gather at the campus cafeteria for lunch between lectures.',
    exampleTr: 'Öğrenciler dersler arasında öğle yemeği için kampüs kafeteryasında toplanır.'
  },
  {
    word: 'canteen',
    meaning: 'kantin',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'You can grab a quick tea or snack from the departmental canteen.',
    exampleTr: 'Bölüm kantininden hızlıca bir çay veya atıştırmalık alabilirsiniz.'
  },
  {
    word: 'auditorium',
    meaning: 'oditoryum, amfi, konferans salonu',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The orientation ceremony will take place in the main campus auditorium.',
    exampleTr: 'Oryantasyon töreni ana kampüs oditoryumunda gerçekleşecek.'
  },
  {
    word: 'seminar',
    meaning: 'seminer, grup çalışma dersi',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Active participation is required in our weekly research seminar.',
    exampleTr: 'Haftalık araştırma seminerimizde aktif katılım zorunludur.'
  },
  {
    word: 'assignment',
    meaning: 'ödev, görev, proje',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'All written assignments must be submitted via the online portal.',
    exampleTr: 'Tüm yazılı ödevler çevrim içi portal üzerinden teslim edilmelidir.'
  },
  {
    word: 'coursework',
    meaning: 'dönem içi ders ödevi/çalışması',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Final grades are calculated from both coursework and the final examination.',
    exampleTr: 'Dönem sonu notları hem dönem içi ödevlerden hem de final sınavından hesaplanır.'
  },
  {
    word: 'deadline',
    meaning: 'son teslim tarihi, son gün',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The deadline for scholarship applications is next Friday at 5 PM.',
    exampleTr: 'Burs başvuruları için son teslim tarihi önümüzdeki cuma saat 17.00’dir.'
  },
  {
    word: 'plagiarism',
    meaning: 'intihal, aşırma, akademik hırsızlık',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'Universities enforce strict penalties for any act of intentional plagiarism.',
    exampleTr: 'Üniversiteler kasıtlı intihal eylemlerine karşı katı yaptırımlar uygular.',
    prepExamTip: 'Hazırlık writing derslerinde sürekli vurgulanan terimdir. Sıfatı: plagiarized, fiili: plagiarize.'
  },
  {
    word: 'dissertation',
    meaning: 'akademik bitirme tezi',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'She spent six months conducting field research for her master dissertation.',
    exampleTr: 'Yüksek lisans tezi için altı ay boyunca saha araştırması yaptı.'
  },
  {
    word: 'thesis',
    meaning: 'tez, bitirme tezi, sav',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'Your essay must start with a concise and argumentative thesis statement.',
    exampleTr: 'Denemeniz kısa ve net bir tez cümlesiyle (thesis statement) başlamalıdır.'
  },
  {
    word: 'scholarship',
    meaning: 'öğrenim bursu',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'He won a merit-based scholarship that covers full tuition fees.',
    exampleTr: 'Tüm okul harcını karşılayan başarı odaklı bir burs kazandı.'
  },
  {
    word: 'tuition',
    meaning: 'öğrenim harcı, okul ücreti',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Tuition fees must be paid before course registration begins.',
    exampleTr: 'Öğrenim harçları ders kaydı başlamadan önce yatırılmalıdır.'
  },
  {
    word: 'faculty',
    meaning: 'fakülte; öğretim kadrosu',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'The Faculty of Engineering boasts modern research laboratories.',
    exampleTr: 'Mühendislik Fakültesi modern araştırma laboratuvarlarıyla övünür.'
  },
  {
    word: 'department',
    meaning: 'bölüm, anabilim dalı',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Contact the department secretary if you experience registration issues.',
    exampleTr: 'Kayıt sorunları yaşarsanız bölüm sekreterliğiyle iletişime geçin.'
  },
  {
    word: 'curriculum',
    meaning: 'müfredat, öğretim programı',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'The preparatory school curriculum is aligned with international CEFR standards.',
    exampleTr: 'Hazırlık okulu müfredatı uluslararası CEFR standartlarıyla uyumludur.'
  },
  {
    word: 'transcript',
    meaning: 'transkript, not döküm belgesi',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'You must provide an official transcript when applying for exchange programs.',
    exampleTr: 'Değişim programlarına başvururken resmi bir transkript sunmalısınız.'
  },
  {
    word: 'midterm',
    meaning: 'vize sınavı, ara sınav',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Students are preparing intensely for their upcoming midterm exams.',
    exampleTr: 'Öğrenciler yaklaşan vize sınavları için yoğun bir şekilde hazırlanıyor.'
  },
  {
    word: 'invigilator',
    meaning: 'sınav gözetmeni',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'The invigilator instructed candidates to place their ID cards on the desk.',
    exampleTr: 'Sınav gözetmeni adaylara kimlik kartlarını masanın üzerine koymalarını söyledi.'
  },
  {
    word: 'lecturer',
    meaning: 'öğretim görevlisi, okutman',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Our English lecturer gave practical tips on academic writing.',
    exampleTr: 'İngilizce okutmanımız akademik yazma konusunda pratik ipuçları verdi.'
  },
  {
    word: 'undergraduate',
    meaning: 'lisans öğrencisi',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Undergraduate students are encouraged to join campus clubs.',
    exampleTr: 'Lisans öğrencilerinin kampüs kulüplerine katılmaları teşvik edilir.'
  },
  {
    word: 'postgraduate',
    meaning: 'lisansüstü öğrencisi (yüksek lisans/doktora)',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'Postgraduate students often work as teaching assistants.',
    exampleTr: 'Lisansüstü öğrencileri sıklıkla asistan olarak görev yapar.'
  },
  {
    word: 'internship',
    meaning: 'staj, stajyerlik',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'A mandatory summer internship prepares students for professional careers.',
    exampleTr: 'Zorunlu bir yaz stajı öğrencileri profesyonel kariyere hazırlar.'
  },

  // 4. Travel & City
  {
    word: 'commute',
    meaning: 'işe/okula gidip gelmek; günlük yolculuk',
    partOfSpeech: 'verb',
    cefrLevel: 'B1',
    exampleEn: 'Thousands of commuters travel by metro to the university every morning.',
    exampleTr: 'Her sabah binlerce yolcu üniversiteye metroyla gidip gelir.'
  },
  {
    word: 'subway',
    meaning: 'metro, yeraltı treni',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'The subway station is located right across from the main campus gate.',
    exampleTr: 'Metro istasyonu ana kampüs kapısının hemen karşısında yer alır.'
  },
  {
    word: 'boarding',
    meaning: 'uçağa/gemiye biniş; yatılı eğitim',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Boarding for flight TK1920 will commence at gate 24.',
    exampleTr: 'TK1920 sefer sayılı uçuş için uçağa biniş 24 numaralı kapıda başlayacak.'
  },
  {
    word: 'carry-on',
    meaning: 'el bagajı, kabin bagajı',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'Passengers are permitted to bring one small carry-on bag into the cabin.',
    exampleTr: 'Yolcuların kabine bir adet küçük el bagajı almasına izin verilir.'
  },
  {
    word: 'customs',
    meaning: 'gümrük, gümrük denetimi',
    partOfSpeech: 'noun',
    cefrLevel: 'B1',
    exampleEn: 'You must declare foreign goods when passing through customs.',
    exampleTr: 'Gümrükten geçerken yabancı malları beyan etmelisiniz.'
  },
  {
    word: 'itinerary',
    meaning: 'seyahat planı, gezi programı',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'Our study abroad trip itinerary includes visits to three partner universities.',
    exampleTr: 'Yurt dışı eğitim gezisi programımız üç ortak üniversiteye ziyaretleri içerir.'
  },
  {
    word: 'hostel',
    meaning: 'pansiyon, hostel',
    partOfSpeech: 'noun',
    cefrLevel: 'A2',
    exampleEn: 'Youth hostels offer economical accommodation for traveling students.',
    exampleTr: 'Gençlik hostelleri seyahat eden öğrenciler için ekonomik konaklama sunar.'
  },

  // 5. Connectors & High-Frequency Academic Adjectives/Verbs
  {
    word: 'nonetheless',
    meaning: 'buna rağmen, yine de, her şeye karşın',
    partOfSpeech: 'adverb',
    cefrLevel: 'B2',
    exampleEn: 'The exam was demanding; nonetheless, most students achieved high marks.',
    exampleTr: 'Sınav zordu; buna rağmen öğrencilerin çoğu yüksek not aldı.',
    prepExamTip: "Akademik writing bölümlerinde 'however' veya 'nevertheless' yerine zenginleştirici bir geçiş bağlacıdır."
  },
  {
    word: 'conversely',
    meaning: 'tersine, aksine, karşıt olarak',
    partOfSpeech: 'adverb',
    cefrLevel: 'B2',
    exampleEn: 'Some students prefer studying alone; conversely, others thrive in study groups.',
    exampleTr: 'Kimi öğrenciler tek başına çalışmayı tercih eder; tersine, kimileri ise çalışma gruplarında daha başarılı olur.'
  },
  {
    word: 'reschedule',
    meaning: 'yeniden planlamak, tarihini değiştirmek',
    partOfSpeech: 'verb',
    cefrLevel: 'B1',
    exampleEn: 'Due to severe weather, the lecture was rescheduled for next Tuesday.',
    exampleTr: 'Şiddetli hava koşulları nedeniyle ders önümüzdeki salı gününe ertelendi.'
  },
  {
    word: 'proofread',
    meaning: 'metni kontrol etmek, tashih etmek',
    partOfSpeech: 'verb',
    cefrLevel: 'B2',
    exampleEn: 'Always proofread your essays carefully before final submission.',
    exampleTr: 'Son teslimden önce denemelerinizi her zaman dikkatlice kontrol edin.'
  },
  {
    word: 'paraphrase',
    meaning: 'başka sözcüklerle ifade etmek, açımlamak',
    partOfSpeech: 'verb',
    cefrLevel: 'B2',
    exampleEn: 'Paraphrase the original source text rather than copying it directly.',
    exampleTr: 'Orijinal kaynak metni doğrudan kopyalamak yerine başka sözcüklerle yeniden ifade edin.'
  },
  {
    word: 'cram',
    meaning: 'sınav öncesi tıka basa çalışmak; tıkıştırmak',
    partOfSpeech: 'verb',
    cefrLevel: 'B1',
    exampleEn: 'Cramming the night before an exam is far less effective than regular revision.',
    exampleTr: 'Sınavdan önceki gece tıka basa çalışmak düzenli tekrardan çok daha az etkilidir.'
  },
  {
    word: 'spacious',
    meaning: 'ferah, geniş, havadar',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'The university library provides a spacious and quiet environment for research.',
    exampleTr: 'Üniversite kütüphanesi araştırma için ferah ve sessiz bir ortam sunar.'
  },
  {
    word: 'cramped',
    meaning: 'dar, sıkışık, basık',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'Four students sharing a single dorm room felt rather cramped.',
    exampleTr: 'Tek bir yurt odasını paylaşan dört öğrenci kendilerini oldukça sıkışık hissetti.'
  },
  {
    word: 'cosy',
    meaning: 'sıcak, rahat, samimi',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'The campus coffee shop is a cosy spot to read between classes.',
    exampleTr: 'Kampüs kafesi dersler arasında kitap okumak için samimi ve sıcak bir yerdir.'
  },
  {
    word: 'furnished',
    meaning: 'eşyalı (daire veya oda)',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'International students usually prefer renting furnished flats.',
    exampleTr: 'Uluslararası öğrenciler genellikle eşyalı daireler kiralamayı tercih eder.'
  },
  {
    word: 'unfurnished',
    meaning: 'eşyasız, boş (daire veya oda)',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'The rent is significantly lower because the flat is unfurnished.',
    exampleTr: 'Daire eşyasız olduğu için kira belirgin şekilde daha düşüktür.'
  },
  {
    word: 'affordable',
    meaning: 'bütçeye uygun, hesaplı, ödenebilir',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'Finding affordable student housing is a top priority for newcomers.',
    exampleTr: 'Bütçeye uygun öğrenci evi bulmak yeni gelenler için en büyük önceliktir.'
  },
  {
    word: 'punctual',
    meaning: 'dakik, vaktine sadık',
    partOfSpeech: 'adjective',
    cefrLevel: 'B1',
    exampleEn: 'Academic presentations require students to be strictly punctual.',
    exampleTr: 'Akademik sunumlar öğrencilerin kesinlikle dakik olmasını gerektirir.'
  },
  {
    word: 'prerequisite',
    meaning: 'ön koşul, ön şart (ders için)',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    exampleEn: 'Passing Introductory Macroeconomics is a prerequisite for this advanced course.',
    exampleTr: 'Giriş düzeyindeki Makroekonomi dersini geçmek bu ileri seviye ders için bir ön koşuldur.'
  },
  {
    word: 'meticulous',
    meaning: 'titiz, kılı kırk yaran, son derece özenli',
    partOfSpeech: 'adjective',
    cefrLevel: 'B2',
    exampleEn: 'Scientific research demands meticulous data collection and analysis.',
    exampleTr: 'Bilimsel araştırma titiz bir veri toplama ve analiz süreci gerektirir.'
  },
  {
    word: 'public',
    meaning: 'halk, kamu; halka açık, umumi',
    partOfSpeech: 'adjective',
    cefrLevel: 'A2',
    exampleEn: 'The university library is open to the public on weekdays.',
    exampleTr: 'Üniversite kütüphanesi hafta içi günlerde halka açıktır.',
    prepExamTip: "Hem sıfat ('halka açık, kamusal') hem de isim ('halk, kamuoyu') olarak çok sık kullanılır: in public (topluluk içinde), public transport (toplu taşıma).",
    collocations: ['public transport', 'in public', 'public opinion', 'public health']
  }
];

// Deduplicate strictly against dictionaryData.json:
// If any word already exists in dictionaryData.json (2,500 core list), skip it!
export const ESSENTIAL_FALLBACK_WORDS: WordEntry[] = RAW_ESSENTIAL_ITEMS
  .filter((item) => {
    const norm = item.word.toLowerCase().trim();
    return !coreWordsSet.has(norm);
  })
  .map((item) => {
    const norm = item.word.toLowerCase().trim();
    return {
      id: `ess_${norm.replace(/[^a-z0-9]/g, '_')}`,
      word: item.word.trim(),
      phonetic: `/${item.word.trim()}/`,
      partOfSpeech: item.partOfSpeech,
      type: item.partOfSpeech === 'adjective' ? 'adj' : item.partOfSpeech === 'adverb' ? 'adv' : item.partOfSpeech,
      cefrLevel: item.cefrLevel,
      level: item.cefrLevel,
      trMeaning: item.meaning,
      meaning: item.meaning,
      enExample: item.exampleEn,
      exampleEn: item.exampleEn,
      trExample: item.exampleTr,
      exampleTr: item.exampleTr,
      academicNote: item.prepExamTip || `Temel hazırlık ve günlük kullanım kelimesi (${item.cefrLevel}).`,
      prepExamTip: item.prepExamTip || `Temel hazırlık ve günlük kullanım kelimesi (${item.cefrLevel}).`,
      collocations: item.collocations || [],
      isCustom: false,
      isFavorite: false,
      isGeneralDict: false,
      status: 'calisiliyor',
    };
  });

// Fast O(1) map for instant exact word lookup
export const ESSENTIAL_FALLBACK_MAP = new Map<string, WordEntry>();
for (const word of ESSENTIAL_FALLBACK_WORDS) {
  ESSENTIAL_FALLBACK_MAP.set(word.word.toLowerCase().trim(), word);
}

/**
 * Fast synchronous lookup in the essential fallback dataset.
 */
export function findInEssentialFallback(word: string): WordEntry | null {
  if (!word) return null;
  const clean = word.toLowerCase().trim();
  return ESSENTIAL_FALLBACK_MAP.get(clean) || null;
}

/**
 * Fast synchronous prefix and substring search across essential fallback words.
 */
export function searchEssentialFallback(query: string, maxResults = 25): WordEntry[] {
  const clean = (query || '').toLowerCase().trim();
  if (!clean) return [];

  const exact: WordEntry[] = [];
  const prefix: WordEntry[] = [];
  const substring: WordEntry[] = [];

  for (const item of ESSENTIAL_FALLBACK_WORDS) {
    const w = item.word.toLowerCase();
    const meaning = item.trMeaning.toLowerCase();

    if (w === clean) {
      exact.push(item);
    } else if (w.startsWith(clean)) {
      prefix.push(item);
    } else if (w.includes(clean) || meaning.includes(clean)) {
      substring.push(item);
    }
  }

  return [...exact, ...prefix, ...substring].slice(0, maxResults);
}
