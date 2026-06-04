export interface Question {
    id: string
    step: number
    text: string
    subtext?: string
    type: 'single' | 'multi' | 'text' | 'time'
    options?: string[]
    placeholder?: string
    required: boolean
    config_key?: string
  }
  
  export const ONBOARDING_QUESTIONS: Question[] = [
    // ── PHASE 1: PURPOSE ──────────────────────────────────────────
    {
      id: 'purpose',
      step: 1,
      text: 'Bu alarmı ne için kuruyorsun?',
      subtext: 'Birden fazla seçebilirsin.',
      type: 'multi',
      options: [
        'Rakip uygulama takibi',
        'Pazar trendleri',
        'Belirli bir teknoloji / alan',
        'Yatırımcı / fon haberleri',
        'Kullanıcı geri bildirimleri',
        'Genel sektör radar',
      ],
      required: true,
    },
    {
      id: 'sector',
      step: 1,
      text: 'Hangi sektör veya niş?',
      subtext: 'Örn: AI müzik üretimi, B2B SaaS, mobil oyun...',
      type: 'text',
      placeholder: 'Sektörü yaz...',
      required: true,
    },
    {
      id: 'audience',
      step: 1,
      text: 'Raporu kim okuyacak?',
      type: 'single',
      options: ['Sadece ben', 'Küçük ekip', 'Yönetim / C-level'],
      required: true,
    },
  
    // ── PHASE 2: SOURCES ──────────────────────────────────────────
    {
      id: 'twitter_accounts',
      step: 2,
      text: 'Takip etmek istediğin Twitter/X hesapları?',
      subtext: 'Hesap adını yaz, Enter ile ekle. Boş bırakabilirsin.',
      type: 'text',
      placeholder: '@suno, @udio, @anthropic...',
      required: false,
      config_key: 'twitter_accounts',
    },
    {
      id: 'subreddits',
      step: 2,
      text: "Reddit'te hangi subredditler?",
      subtext: 'Subreddit adını yaz, Enter ile ekle.',
      type: 'text',
      placeholder: 'r/musicai, r/artificial, r/MachineLearning...',
      required: false,
      config_key: 'subreddits',
    },
    {
      id: 'app_store_ids',
      step: 2,
      text: "App Store'da takip etmek istediğin uygulamalar?",
      subtext: 'Uygulama adı veya ID.',
      type: 'text',
      placeholder: 'Suno, Udio, 6747571942...',
      required: false,
      config_key: 'app_store_ids',
    },
    {
      id: 'news_keywords',
      step: 2,
      text: 'Haber başlıklarında aranacak anahtar kelimeler?',
      subtext: 'Virgülle ayır.',
      type: 'text',
      placeholder: 'AI music, generative audio, music copyright...',
      required: false,
      config_key: 'news_keywords',
    },
    {
      id: 'other_sources',
      step: 2,
      text: 'Başka platform var mı?',
      subtext: 'Birden fazla seçebilirsin.',
      type: 'multi',
      options: [
        'YouTube kanalları',
        'LinkedIn şirket sayfaları',
        'Product Hunt',
        'Hacker News',
        'Hiçbiri',
      ],
      required: false,
    },
  
    // ── PHASE 3: SCHEDULE ─────────────────────────────────────────
    {
      id: 'schedule_type',
      step: 3,
      text: 'Bu alarm ne sıklıkta çalışsın?',
      type: 'single',
      options: ['Her gün', 'Belirli günler', 'Sadece hafta içi', 'Haftalık (tek gün)'],
      required: true,
      config_key: 'schedule',
    },
    {
      id: 'schedule_time',
      step: 3,
      text: 'Hangi saatte rapor hazırlansın?',
      subtext: 'İstanbul saatiyle.',
      type: 'time',
      required: true,
      config_key: 'schedule',
    },
  
    // ── PHASE 4: ALARM NAME ───────────────────────────────────────
    {
      id: 'alarm_name',
      step: 4,
      text: 'Bu alarma bir isim ver.',
      subtext: 'Sonradan değiştirebilirsin.',
      type: 'text',
      placeholder: 'AI Müzik Rakip Radar, Haftalık Trend Özeti...',
      required: true,
    },
  ]
  
  export const TOTAL_STEPS = 4
  
  export const STEP_LABELS = ['Amaç', 'Kaynaklar', 'Zamanlama', 'İsim']