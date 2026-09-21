-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

-- SETTINGS (daily target)
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lessons_target INT NOT NULL DEFAULT 1,
  dhikr_target INT NOT NULL DEFAULT 100,
  blocked_apps TEXT[] NOT NULL DEFAULT ARRAY['Instagram','TikTok','YouTube'],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.user_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LESSONS (global content, chronological reading order)
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index INT NOT NULL UNIQUE,
  surah_number INT NOT NULL,
  surah_name_en TEXT NOT NULL,
  surah_name_ar TEXT NOT NULL,
  ayah_start INT NOT NULL,
  ayah_end INT NOT NULL,
  title TEXT NOT NULL,
  arabic TEXT NOT NULL,
  translation TEXT NOT NULL,
  tafsir TEXT NOT NULL,
  quiz_question TEXT NOT NULL,
  quiz_options JSONB NOT NULL,
  quiz_answer INT NOT NULL
);
GRANT SELECT ON public.lessons TO authenticated, anon;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons readable" ON public.lessons FOR SELECT TO authenticated, anon USING (true);

-- COMPLETIONS
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  correct BOOLEAN NOT NULL DEFAULT true,
  completed_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_completions TO authenticated;
GRANT ALL ON public.lesson_completions TO service_role;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions" ON public.lesson_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ADHKAR CATALOG
CREATE TABLE public.adhkar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  arabic TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  translation TEXT NOT NULL,
  default_count INT NOT NULL DEFAULT 33,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.adhkar TO authenticated, anon;
GRANT ALL ON public.adhkar TO service_role;
ALTER TABLE public.adhkar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adhkar readable" ON public.adhkar FOR SELECT TO authenticated, anon USING (true);

-- DAILY DHIKR COUNTS
CREATE TABLE public.dhikr_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adhkar_id UUID NOT NULL REFERENCES public.adhkar(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count INT NOT NULL DEFAULT 0,
  target INT NOT NULL DEFAULT 33,
  UNIQUE (user_id, adhkar_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dhikr_counts TO authenticated;
GRANT ALL ON public.dhikr_counts TO service_role;
ALTER TABLE public.dhikr_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dhikr" ON public.dhikr_counts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SEED ADHKAR
INSERT INTO public.adhkar (slug, arabic, transliteration, translation, default_count, sort_order) VALUES
('subhanallah', 'سُبْحَانَ اللَّهِ', 'SubhanAllah', 'Glory be to Allah', 33, 1),
('alhamdulillah', 'الْحَمْدُ لِلَّهِ', 'Alhamdulillah', 'All praise is for Allah', 33, 2),
('allahuakbar', 'اللَّهُ أَكْبَرُ', 'Allahu Akbar', 'Allah is the Greatest', 34, 3),
('astaghfirullah', 'أَسْتَغْفِرُ اللَّهَ', 'Astaghfirullah', 'I seek forgiveness from Allah', 33, 4),
('salawat', 'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', 'Salawat on the Prophet', 'Peace and blessings be upon him', 10, 5);

-- SEED LESSONS
INSERT INTO public.lessons (order_index, surah_number, surah_name_en, surah_name_ar, ayah_start, ayah_end, title, arabic, translation, tafsir, quiz_question, quiz_options, quiz_answer) VALUES
(1, 1, 'Al-Fatihah', 'الفاتحة', 1, 4, 'The Praise of the Lord of All Worlds', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ', 'In the name of Allah, the Most Compassionate, the Most Merciful. All praise is for Allah, Lord of all worlds. The Most Compassionate, the Most Merciful. Master of the Day of Judgement.', 'The Quran opens by naming God before anything else, then praising Him as Rabb — the one who creates, sustains and nurtures every world. Mercy is mentioned twice before judgement is mentioned once, teaching the believer to approach God with hope before fear.', 'Why is mercy mentioned before the Day of Judgement?', '["To teach that hope in God comes before fear of Him", "Because judgement is not real", "To shorten the surah", "Because mercy only applies to angels"]', 0),
(2, 1, 'Al-Fatihah', 'الفاتحة', 5, 7, 'The Straight Path', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'You alone we worship, and You alone we ask for help. Guide us along the straight path, the path of those You have blessed, not of those who earned anger, nor of those who went astray.', 'The surah turns from speaking about God to speaking to Him. The central request of the whole Quran is guidance — not wealth or safety. The two failed groups are those who knew the truth and rejected it, and those who acted without knowledge.', 'What is the central request made in Al-Fatihah?', '["Wealth", "Guidance to the straight path", "Long life", "Victory over enemies"]', 1),
(3, 2, 'Al-Baqarah', 'البقرة', 1, 5, 'Who Benefits From the Book', 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ ۝ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ', 'This is the Book about which there is no doubt, a guidance for those conscious of Allah — who believe in the unseen, establish prayer, and spend out of what We have provided for them.', 'Guidance is described as reaching the muttaqin — the God-conscious. The Quran is light, but light only benefits eyes that are open. Three marks are given: belief in what cannot be seen, consistency in prayer, and generosity with provision.', 'According to these verses, who does the Quran guide?', '["Everyone equally", "Only scholars", "Those who are conscious of Allah", "Only Arabs"]', 2),
(4, 2, 'Al-Baqarah', 'البقرة', 6, 16, 'Three Responses to Truth', 'إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ ۝ وَمِنَ النَّاسِ مَن يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُم بِمُؤْمِنِينَ', 'As for those who persist in disbelief, warning them is of no use — they will not believe. And there are some who say we believe in Allah and the Last Day, yet they are not believers.', 'The passage sorts humanity into three groups: the believers, the openly rejecting, and the hypocrites who say one thing publicly and hold another privately. Most verses are spent on the third group, because self-deception is the hardest disease to notice.', 'Which group does this passage spend the most verses describing?', '["The believers", "The openly rejecting", "The hypocrites", "The angels"]', 2),
(5, 2, 'Al-Baqarah', 'البقرة', 21, 29, 'The Challenge of the Quran', 'يَا أَيُّهَا النَّاسُ اعْبُدُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ وَالَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ', 'O humanity, worship your Lord who created you and those before you, so that you may become mindful of Him.', 'Worship is grounded in a reason: He created you. Then the Quran issues an open challenge — produce a single chapter like it — and promises a garden to those who believe and act well. Reason, challenge, and reward are placed side by side.', 'What reason does the verse give for worshipping God?', '["He created you", "He is feared by all", "Others do it", "It brings wealth"]', 0),
(6, 2, 'Al-Baqarah', 'البقرة', 30, 39, 'Adam and the Trust of Knowledge', 'وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً', 'And remember when your Lord said to the angels, I am placing a steward upon the earth.', 'Adam is honoured not by strength but by being taught the names — knowledge. His fall is followed immediately by words of repentance taught to him by God, establishing from the very first human that sin is not the end of the story.', 'What was Adam honoured with above the angels?', '["Strength", "Knowledge of the names", "Wings", "Wealth"]', 1),
(7, 2, 'Al-Baqarah', 'البقرة', 40, 61, 'Lessons From the Children of Israel', 'يَا بَنِي إِسْرَائِيلَ اذْكُرُوا نِعْمَتِيَ الَّتِي أَنْعَمْتُ عَلَيْكُمْ وَأَوْفُوا بِعَهْدِي أُوفِ بِعَهْدِكُمْ', 'O Children of Israel, remember My favour upon you, and honour your covenant with Me and I shall honour Mine with you.', 'A long retelling of rescue from Pharaoh, the parted sea, and the manna — followed each time by forgetfulness. The purpose is not to accuse a nation but to warn every community that receives guidance: favour without gratitude becomes a burden.', 'What is the purpose of retelling these events?', '["To accuse one nation forever", "To warn any community given guidance not to forget it", "To record history only", "To explain geography"]', 1),
(8, 2, 'Al-Baqarah', 'البقرة', 62, 86, 'The Cow and the Hardened Heart', 'ثُمَّ قَسَتْ قُلُوبُكُم مِّن بَعْدِ ذَٰلِكَ فَهِيَ كَالْحِجَارَةِ أَوْ أَشَدُّ قَسْوَةً', 'Then your hearts became hard, like stone or even harder.', 'The episode that names the surah: a simple command about a cow met with endless questioning. Delay in obedience is shown to be its own disease, and the passage closes with the image of hearts turning to stone through repeated evasion.', 'What does the story of the cow illustrate?', '["The value of livestock", "That delay and excessive questioning harden the heart", "A dietary law", "A tax rule"]', 1),
(9, 2, 'Al-Baqarah', 'البقرة', 87, 112, 'Faith Is Not a Family Name', 'وَقَالُوا لَن يَدْخُلَ الْجَنَّةَ إِلَّا مَن كَانَ هُودًا أَوْ نَصَارَىٰ ۗ تِلْكَ أَمَانِيُّهُم', 'And they said none will enter Paradise except a Jew or a Christian. Those are merely their wishes.', 'Salvation by label is dismantled. The verse that answers it is deliberately plain: whoever submits their face to God and does good will be rewarded. Belonging is replaced with submission and action.', 'What does the passage say determines reward?', '["The group you belong to", "Submitting to God and doing good", "Your ancestry", "Your language"]', 1),
(10, 2, 'Al-Baqarah', 'البقرة', 124, 141, 'Ibrahim and the Kaaba', 'وَإِذْ يَرْفَعُ إِبْرَاهِيمُ الْقَوَاعِدَ مِنَ الْبَيْتِ وَإِسْمَاعِيلُ رَبَّنَا تَقَبَّلْ مِنَّا', 'And as Ibrahim and Ismail raised the foundations of the House, they prayed: Our Lord, accept this from us.', 'Ibrahim is claimed by no sect — he is described simply as one who submitted. Father and son build the House with their hands and still fear their work may not be accepted, modelling the fear of the sincere rather than the confidence of the entitled.', 'How is Ibrahim described in this passage?', '["As a Jew", "As a Christian", "As one who simply submitted to God", "As a king"]', 2),
(11, 2, 'Al-Baqarah', 'البقرة', 142, 167, 'A New Direction and Patient Hearts', 'فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَأَيْنَمَا كُنتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ', 'So turn your face toward the Sacred Mosque, and wherever you are, turn your faces toward it.', 'The qibla changes to Makkah, and with it comes the famous instruction to seek help through patience and prayer, and the promise that those who are struck by loss and say we belong to God will receive His mercy.', 'What two things are believers told to seek help through?', '["Wealth and status", "Patience and prayer", "Numbers and strength", "Silence and sleep"]', 1),
(12, 2, 'Al-Baqarah', 'البقرة', 168, 186, 'Fasting and Nearness', 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ', 'O you who believe, fasting has been prescribed for you as it was prescribed for those before you, so that you may become mindful of God.', 'Fasting is given a purpose rather than a mere rule: taqwa. In the middle of the legislation comes one of the closest verses in the Quran — when My servants ask about Me, I am near — placing intimacy at the heart of discipline.', 'What is the stated purpose of fasting?', '["Losing weight", "Becoming mindful of God", "Saving food", "Following tradition only"]', 1);
