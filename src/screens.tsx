import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import * as Picker from 'expo-image-picker';
import hobbiesJSON from './data/hobbies.json';

const visualByHobby: Record<string, any> = {
  baking: require('../assets/hobbies/baking.png'),
  cooking: require('../assets/hobbies/cooking.png'),
  photography: require('../assets/hobbies/photography.png'),
  painting: require('../assets/hobbies/painting.png'),
  hiking: require('../assets/hobbies/hiking.png'),
  knitting: require('../assets/hobbies/knitting.png'),
  sewing: require('../assets/hobbies/sewing.png'),
  writing: require('../assets/hobbies/writing.png'),
  'creative-writing': require('../assets/hobbies/writing.png'),
  coding: require('../assets/hobbies/coding.png'),
  guitar: require('../assets/hobbies/guitar.png'),
  gardening: require('../assets/hobbies/planting.png'),
  'indoor-plants': require('../assets/hobbies/planting.png'),
  'herb-gardening': require('../assets/hobbies/planting.png'),
  'home-cleaning': require('../assets/hobbies/cleaning.png'),
  'handyman-skills': require('../assets/hobbies/handyman.png'),
  'smoothie-and-juice-making': require('../assets/hobbies/drinks.png')
};
const fallbackVisual = require('../assets/hobbies/hero.png');
const categoryVisual: Record<string, any> = {
  food: require('../assets/hobbies/cooking.png'),
  craft: require('../assets/hobbies/knitting.png'),
  art: require('../assets/hobbies/painting.png'),
  home: require('../assets/hobbies/planting.png'),
  digital: require('../assets/hobbies/coding.png'),
  photo: require('../assets/hobbies/photography.png'),
  resale: require('../assets/hobbies/farmersmarket.png')
};
const hobbyVisual = (id: string) => {
  const hobby = hobbiesJSON.find((item: any) => item.id === id);
  return visualByHobby[id] || categoryVisual[hobby?.category] || fallbackVisual;
};
import {firstProject, hobbyGuide, hobbyName, localeName, locales, tr} from './i18n';
import {calc, scenarioCalc} from './math';
import {Fun, Goal, QuizAnswers, Spend, Time, rankHobbies} from './quiz';
import {clearAll, keepPhoto} from './storage';
import {C, useColors, useType} from './theme';
import {s} from './styles';
import {Hobby, LocaleCode, Project, State} from './types';

const hobbies = hobbiesJSON as Hobby[];
const SITE = 'https://hobbyworth.everittventures.com';

export type Screen = 'home' | 'quiz' | 'pick' | 'first' | 'calc' | 'history' | 'compare' | 'settings';

export const blank = (hobbyId: string): Project => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  hobbyId,
  createdAt: new Date().toISOString(),
  steps: [],
  numbers: {cost: '', minutes: '', yield: '', price: ''},
  split: {materials: '', packaging: '', fees: ''},
  scenarios: ['', '', ''],
  photos: [],
  coverPhotoIndex: 0,
  note: ''
});

export const money = (value: number, symbol: string) =>
  `${symbol}${Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2).replace(/\.00$/, '')}`;

function Page({children}: {children: React.ReactNode}) {
  const type = useType();
  const colors = useColors();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.page, {backgroundColor: colors.surface, paddingHorizontal: type.pagePad, paddingTop: 8, paddingBottom: 88}]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[s.pageInner, {maxWidth: type.max, gap: Math.min(type.gap, 12)}]}>{children}</View>
    </ScrollView>
  );
}

function Heading({children, level = 1}: {children: React.ReactNode; level?: 1 | 2 | 3}) {
  const type = useType();
  const colors = useColors();
  const size = level === 1 ? type.h1 : level === 2 ? type.h2 : type.h3;
  return <Text accessibilityRole="header" style={[level === 1 ? s.h1 : level === 2 ? s.h2 : s.h3, {fontSize: size, lineHeight: size + 7, color: colors.text}]}>{children}</Text>;
}

function HeroHeading({children}: {children: React.ReactNode}) {
  const type = useType();
  const colors = useColors();
  return <Text accessibilityRole="header" style={[s.h1, {fontSize: type.hero, lineHeight: type.hero + 7, color: colors.text}]}>{children}</Text>;
}

function Button({text, onPress, outline = false, disabled = false}: {text: string; onPress: () => void; outline?: boolean; disabled?: boolean}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [s.btn, {backgroundColor: outline ? colors.surfaceStrong : colors.action}, outline && [s.outline, {borderColor: colors.accentLine}], disabled && {opacity: 0.5}, pressed && !disabled && {backgroundColor: outline ? colors.surfaceSoft : colors.actionPressed}]}
    >
      <Text style={[s.btnText, {color: outline ? colors.accent : colors.surfaceStrong}]}>{text}</Text>
    </Pressable>
  );
}

function LinkButton({text, onPress}: {text: string; onPress: () => void}) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.linkHit}>
      <Text style={[s.link, {color: colors.accent}]}>{text}</Text>
    </Pressable>
  );
}

function Field({label, value, onChange, symbol = ''}: {label: string; value: string; onChange: (value: string) => void; symbol?: string}) {
  const colors = useColors();
  return (
    <View style={s.field}>
      <Text style={[s.small, {color: colors.textMuted}]}>{label}</Text>
      <View style={[s.inputRow, {backgroundColor: colors.surfaceStrong, borderColor: colors.line}]}>
        {symbol ? <Text style={[s.symbol, {color: colors.text}]}>{symbol}</Text> : null}
        <TextInput
          accessibilityLabel={label}
          keyboardType="decimal-pad"
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={[s.input, {color: colors.text}]}
          value={value}
        />
      </View>
    </View>
  );
}

function Metric({label, value}: {label: string; value: string}) {
  const colors = useColors();
  return <View style={[s.metric, {backgroundColor: colors.surfaceStrong, borderColor: colors.line}]}><Text style={[s.small, {color: colors.textMuted}]}>{label}</Text><Text style={[s.metricValue, {color: colors.text}]}>{value}</Text></View>;
}

function AnimatedMoney({value, symbol, loss = false}: {value: number; symbol: string; loss?: boolean}) {
  const progress = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    scale.setValue(0.96);
    const listener = progress.addListener(({value: amount}) => setDisplay(value * amount));
    Animated.parallel([
      Animated.timing(progress, {toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false}),
      Animated.spring(scale, {toValue: 1, friction: 7, tension: 80, useNativeDriver: true})
    ]).start();
    return () => progress.removeListener(listener);
  }, [progress, scale, value]);

  return (
    <Animated.Text
      accessibilityLabel={money(value, symbol)}
      style={[s.resultValue, loss && s.resultValueLoss, {transform: [{scale}]}]}
    >
      {money(display, symbol)}
    </Animated.Text>
  );
}

export function Home({st, setProject, go, pay}: {st: State; setProject: (project: Project) => void; go: (screen: Screen) => void; pay: () => void}) {
  const l = st.locale;
  if (!st.project) {
    return (
      <Page>
        <View accessible={false} importantForAccessibility="no-hide-descendants" style={s.homeHero}>
          <Image source={fallbackVisual} resizeMode="cover" style={s.visualHero} />
          <View style={s.visualOverlay} />
          <Text style={s.heroWord}>HobbyWorth</Text>
        </View>
        <HeroHeading>{tr(l, 'ui.todayPromise')}</HeroHeading>
        <Text style={s.body}>{tr(l, 'ui.todayExample')}</Text>
        <View style={s.card}>
          <Button text={tr(l, 'ui.quiz')} onPress={() => go('quiz')} />
          <LinkButton text={tr(l, 'ui.browseHobbies')} onPress={() => go('pick')} />
        </View>
        <Text style={s.kicker}>{tr(l, 'ui.popularFirstProjects')}</Text>
        {['baking','photography','knitting'].map((id) => {
          const hobby = hobbies.find((item) => item.id === id);
          if (!hobby) return null;
          const first = firstProject(l, id);
          return <Pressable key={id} accessibilityRole="button" onPress={() => { setProject(blank(id)); go('first'); }} style={({pressed}) => [s.resultHobbyCard, pressed && s.outlinePressed]}>
            <Image source={hobbyVisual(id)} resizeMode="cover" style={s.visualCompact} />
            <View style={s.resultHobbyBody}><Heading level={3}>{hobbyName(id,l)}</Heading><Text style={s.body} numberOfLines={2}>{first.first}</Text></View>
            <Text accessible={false} style={s.arrow}>›</Text>
          </Pressable>;
        })}
        <View style={s.card}>
          <LinkButton text={tr(l, 'ui.wantHistoryCompare')} onPress={pay} />
        </View>
        <Text style={s.helper}>{tr(l, 'ui.numbersLine')}</Text>
      </Page>
    );
  }

  const project = firstProject(l, st.project.hobbyId);
  const done = project.steps.map((_, index) => st.project?.steps[index] || false);
  const next = done.findIndex((value) => !value);
  const complete = next < 0;
  const index = complete ? Math.max(0, project.steps.length - 1) : next;
  const completedCount = done.filter(Boolean).length;
  const activeProgress = project.steps.length ? completedCount / project.steps.length : 0;
  const toggle = () => {
    if (complete || !st.project) return;
    const steps = [...done];
    steps[index] = true;
    setProject({...st.project, steps});
  };

  return (
    <Page>
      <Text style={s.kicker}>{tr(l, 'ui.today')}</Text>
      <Heading>{hobbyName(st.project.hobbyId, l)}</Heading>
      <View style={[s.todayCard, s.cardShadow]}>
        <View style={s.progressTrack}><View style={[s.progressFill, {width: `${Math.round(activeProgress * 100)}%`}]} /></View>
        <Text style={s.small}>{complete ? tr(l, 'ui.projectComplete') : tr(l, 'ui.stepOf', {current: index + 1, total: project.steps.length})}</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{checked: complete}} onPress={toggle} style={s.todayRow}>
          <View style={[s.bigCheck, complete && s.checkOn]}><Text style={s.bigCheckText}>{complete ? '✓' : ''}</Text></View>
          <Text style={[s.todayText, complete && s.strike]}>{complete ? tr(l, 'ui.projectComplete') : project.steps[index]}</Text>
        </Pressable>
      </View>
      <View style={s.pale}>
        <Heading level={3}>{tr(l, 'ui.write')}</Heading>
        <Text style={s.body}>{tr(l, 'ui.logBatchBody')}</Text>
        <Button text={tr(l, 'ui.logBatch')} onPress={() => go('calc')} />
      </View>
      <LinkButton text={tr(l, 'ui.viewFirstProject')} onPress={() => go('first')} />
      {st.premium ? <View style={s.card}><LinkButton text={tr(l, 'ui.history')} onPress={() => go('history')} /><LinkButton text={tr(l, 'ui.compare')} onPress={() => go('compare')} /></View> : null}
      <Text style={s.helper}>{tr(l, 'ui.numbersLine')}</Text>
    </Page>
  );
}

export function Pick({st, choose}: {st: State; choose: (hobby: Hobby) => void}) {
  const l = st.locale;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = ['all', 'food', 'craft', 'art', 'home', 'digital', 'photo', 'resale'];
  const categoryLabel: Record<string, string> = {
    all: 'categoryAll', food: 'categoryFood', craft: 'categoryCraft', art: 'categoryArt',
    home: 'categoryHome', digital: 'categoryDigital', photo: 'categoryPhoto', resale: 'categoryResale'
  };
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return hobbies.filter((hobby) => {
      const categoryMatch = category === 'all' || hobby.category === category;
      const nameMatch = !needle || hobbyName(hobby.id, l).toLocaleLowerCase().includes(needle);
      return categoryMatch && nameMatch;
    });
  }, [query, category, l]);

  return (
    <Page>
      <Heading>{tr(l, 'ui.pick')}</Heading>
      <TextInput
        accessibilityLabel={tr(l, 'ui.searchHobbies')}
        onChangeText={setQuery}
        placeholder={tr(l, 'ui.searchHobbies')}
        placeholderTextColor={C.muted}
        style={s.searchInput}
        value={query}
      />
      <View style={s.chipWrap}>
        {categories.map((item) => {
          const on = category === item;
          return <Pressable
            accessibilityRole="radio"
            accessibilityState={{checked: on}}
            key={item}
            onPress={() => setCategory(item)}
            style={[s.chip, on && s.chipOn]}
          ><Text style={[s.chipText, on && s.chipOnText]}>{tr(l, `ui.${categoryLabel[item]}`)}</Text></Pressable>;
        })}
      </View>
      <Text style={s.helper}>{tr(l, 'ui.resultCount', {n: filtered.length})}</Text>
      {filtered.length ? filtered.map((hobby) => (
        <Pressable
          accessibilityLabel={hobbyName(hobby.id, l)}
          accessibilityRole="button"
          key={hobby.id}
          onPress={() => choose(hobby)}
          style={({pressed}) => [s.hobby, {backgroundColor: hobby.category === 'food' ? '#FFF0EC' : hobby.category === 'craft' ? '#F8F0E6' : hobby.category === 'art' ? '#F2EEF8' : hobby.category === 'digital' ? '#EDF9FC' : hobby.category === 'photo' ? '#EEF4F8' : hobby.category === 'home' ? '#F3F4EA' : '#FFFFFF'}, pressed && s.outlinePressed]}
        >
          <Image source={hobbyVisual(hobby.id)} resizeMode="cover" style={s.visualCompact} />
          <View style={{flex: 1}}><Text style={s.h3}>{hobbyName(hobby.id, l)}</Text><Text style={s.small} numberOfLines={2}>{firstProject(l, hobby.id).first}</Text></View>
          <Text accessible={false} style={s.arrow}>›</Text>
        </Pressable>
      )) : <View style={s.card}><Heading level={3}>{tr(l, 'ui.noHobbyResults')}</Heading><Text style={s.body}>{tr(l, 'ui.tryAnotherSearch')}</Text></View>}
    </Page>
  );
}

type QuizOption = {value: Fun | Spend | Time | Goal; label: string};
type QuizQuestion = {answer: keyof QuizAnswers; title: string; options: QuizOption[]};

export function Quiz({st, choose}: {st: State; choose: (hobby: Hobby) => void}) {
  const l = st.locale;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const questions: QuizQuestion[] = [
    {answer: 'fun', title: 'funQ', options: [{value: 'make', label: 'makeOpt'}, {value: 'digital', label: 'digitalOpt'}, {value: 'photo', label: 'photoOpt'}, {value: 'resell', label: 'resellOpt'}]},
    {answer: 'spend', title: 'spendQ', options: [{value: 'low', label: 'lowOpt'}, {value: 'mid', label: 'midOpt'}, {value: 'flex', label: 'flexOpt'}]},
    {answer: 'time', title: 'timeQ', options: [{value: 'short', label: 'shortOpt'}, {value: 'med', label: 'medOpt'}, {value: 'long', label: 'longOpt'}]},
    {answer: 'goal', title: 'goalQ', options: [{value: 'finish', label: 'finishOpt'}, {value: 'sell', label: 'sellOpt'}, {value: 'repeat', label: 'repeatOpt'}]}
  ];

  if (step === questions.length) {
    return (
      <Page>
        <Heading>{tr(l, 'ui.matches')}</Heading>
        {rankHobbies(hobbies, answers).map((hobby, index) => (
          <Pressable accessibilityRole="button" key={hobby.id} onPress={() => choose(hobby)} style={({pressed}) => [s.resultHobbyCard, pressed && s.outlinePressed]}>
            <Image source={hobbyVisual(hobby.id)} resizeMode="cover" style={s.visualCompact} />
            <View style={s.resultHobbyBody}>
              <Text style={s.kicker}>{String(index + 1).padStart(2, '0')}</Text>
              <Heading level={2}>{hobbyName(hobby.id, l)}</Heading>
              <Text style={s.body} numberOfLines={2}>{firstProject(l, hobby.id).first}</Text>
              <Text style={s.link}>{tr(l, 'ui.start')}</Text>
            </View>
          </Pressable>
        ))}
      </Page>
    );
  }

  const question = questions[step];
  const selected = answers[question.answer];
  return (
    <Page>
      <Text style={s.kicker}>{step + 1} / {questions.length}</Text>
      <Heading>{tr(l, `ui.${question.title}`)}</Heading>
      {question.options.map((option) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{checked: selected === option.value}}
          key={option.value}
          onPress={() => setAnswers((current) => ({...current, [question.answer]: option.value}))}
          style={({pressed}) => [s.choice, selected === option.value && s.choiceOn, pressed && s.outlinePressed]}
        >
          <Text style={[s.h3, selected === option.value && s.choiceOnText]}>{tr(l, `ui.${option.label}`)}</Text>
        </Pressable>
      ))}
      <Button text={tr(l, 'ui.next')} disabled={!selected} onPress={() => { if (selected) setStep((current) => current + 1); }} />
      {step > 0 ? <LinkButton text={tr(l, 'ui.back')} onPress={() => setStep((current) => current - 1)} /> : null}
    </Page>
  );
}

export function First({st, setProject, go}: {st: State; setProject: (project: Project) => void; go: (screen: Screen) => void}) {
  const p = st.project!;
  const l = st.locale;
  const name = hobbyName(p.hobbyId, l);
  const project = firstProject(l, p.hobbyId);
  const guide = hobbyGuide(l, p.hobbyId);
  const done = project.steps.map((_, index) => p.steps[index] || false);
  const completedSteps = done.filter(Boolean).length;
  const progress = project.steps.length ? completedSteps / project.steps.length : 0;
  return (
    <Page>
      <View style={s.projectHero}><View style={s.heroCircleLarge} /><View style={s.heroCircleSmall} /><Image source={hobbyVisual(p.hobbyId)} resizeMode="cover" style={s.visualHero} /><View style={s.visualOverlay} /><Text style={s.projectHeroText}>{name}</Text></View>
      <Text style={s.kicker}>{tr(l, 'ui.guide')}</Text>
      <Heading>{name}</Heading>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.guideBefore')}</Heading>
        <Text style={s.body}>{guide?.goodToKnow || tr(l, 'ui.guideBeforeBody')}</Text>
      </View>
      <View style={s.pale}>
        <Heading level={3}>{tr(l, 'ui.guideMonth')}</Heading>
        <Text style={s.body}>{guide?.firstMove || tr(l, 'ui.guideMonthBody')}</Text>
        {guide?.firstWeek?.map((item, index) => <Text key={index} style={s.body}>{index + 1}. {item}</Text>)}
      </View>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.guideFit')}</Heading>
        <Text style={s.body}>{tr(l, 'ui.guideFitBody')}</Text>
      </View>
      <Text style={s.kicker}>{tr(l, 'ui.first')}</Text>
      <View style={s.pink}><Text style={s.kicker}>{tr(l, 'ui.make')}</Text><Heading level={2}>{project.first}</Heading></View>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.need')}</Heading>
        {project.need.map((item) => <Text key={item} style={s.body}>• {item}</Text>)}
      </View>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.steps')}</Heading>
        <Text style={s.small}>{completedSteps} / {project.steps.length}</Text>
        <View style={s.progressTrack}><View style={[s.progressFill, {width: `${Math.round(progress * 100)}%`}]} /></View>
        {project.steps.map((item, index) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{checked: done[index]}}
            key={`${index}-${item}`}
            onPress={() => { const steps = [...done]; steps[index] = !steps[index]; setProject({...p, steps}); }}
            style={s.checkRow}
          >
            <View style={[s.check, done[index] && s.checkOn]}><Text style={s.checkMark}>{done[index] ? '✓' : ''}</Text></View>
            <Text style={[s.body, {flex: 1}, done[index] && s.strike]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.pale}><Heading level={3}>{tr(l, 'ui.write')}</Heading><Text style={s.body}>{`${tr(l, 'ui.cost')} · ${tr(l, 'ui.minutes')} · ${tr(l, 'ui.yield')} · ${tr(l, 'ui.price')}`}</Text></View>
      <Button text={tr(l, 'ui.calculate')} onPress={() => go('calc')} />
    </Page>
  );
}

export function Calculator({st, setProject, finish, pay}: {st: State; setProject: (project: Project) => void; finish: () => void; pay: () => void}) {
  const p = st.project!;
  const l = st.locale;
  const [stage, setStage] = useState<'log' | 'price'>('log');
  const [viewer, setViewer] = useState<string | null>(null);
  const result = calc(p.numbers, st.premium ? p.split : undefined);
  const verdict = result.leftover <= 0 ? tr(l, 'ui.notYet') : result.breakEven <= Math.max(1, result.yieldCount) ? tr(l, 'ui.yesIf', {n: result.breakEven}) : tr(l, 'ui.maybe');
  const setNumber = (key: keyof Project['numbers'], value: string) => setProject({...p, numbers: {...p.numbers, [key]: value}});
  const setSplit = (key: keyof Project['split'], value: string) => setProject({...p, split: {...p.split, [key]: value}});
  const addPhotos = async () => {
    if (p.photos.length >= 5) return;
    const response = await Picker.launchImageLibraryAsync({mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - p.photos.length, quality: 0.85});
    if (response.canceled) return;
    const saved: string[] = [];
    for (const asset of response.assets) saved.push(await keepPhoto(asset.uri, p.id));
    const photos = [...p.photos, ...saved].slice(0, 5);
    setProject({...p, photos, coverPhotoIndex: Math.min(p.coverPhotoIndex || 0, Math.max(0, photos.length - 1))});
  };

  return (
    <Page>
      <Text style={s.kicker}>{stage === 'log' ? tr(l, 'ui.logBatchStep') : tr(l, 'ui.priceIt')}</Text>
      <Heading>{hobbyName(p.hobbyId, l)}</Heading>
      {stage === 'log' ? <>
        <View style={s.grid}>
          <Field label={tr(l, 'ui.cost')} value={p.numbers.cost} onChange={(value) => setNumber('cost', value)} symbol={st.symbol} />
          <Field label={tr(l, 'ui.minutes')} value={p.numbers.minutes} onChange={(value) => setNumber('minutes', value)} />
          <Field label={tr(l, 'ui.yield')} value={p.numbers.yield} onChange={(value) => setNumber('yield', value)} />
        </View>
        <View style={s.card}>
          <Heading level={3}>{tr(l, 'ui.photos')}</Heading>
          <View style={s.photoRow}>{p.photos.map((uri, index) => <View key={uri}>
            <Pressable accessibilityRole="button" accessibilityLabel={tr(l, 'ui.viewPhoto')} onPress={() => setViewer(uri)}>
              <Image source={{uri}} style={[s.photo, index === (p.coverPhotoIndex || 0) && s.photoCover]} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setProject({...p, coverPhotoIndex: index})} style={s.photoAction}>
              <Text style={s.photoLabel}>{index === (p.coverPhotoIndex || 0) ? tr(l, 'ui.coverPhoto') : tr(l, 'ui.makeCover')}</Text>
            </Pressable>
          </View>)}</View>
          <LinkButton text={tr(l, 'ui.photos')} onPress={addPhotos} />
        </View>
        <TextInput accessibilityLabel={tr(l, 'ui.notePlaceholder')} multiline onChangeText={(note) => setProject({...p, note})} placeholder={tr(l, 'ui.notePlaceholder')} placeholderTextColor={C.muted} style={s.note} value={p.note} />
        <Button text={tr(l, 'ui.continueToPrice')} onPress={() => setStage('price')} />
      </> : <>
        <View style={s.card}>
          <Heading level={3}>{tr(l, 'ui.priceIt')}</Heading>
          <Field label={tr(l, 'ui.price')} value={p.numbers.price} onChange={(value) => setNumber('price', value)} symbol={st.symbol} />
        </View>
        {st.premium ? <>
          <View style={s.pale}>
            <Heading level={3}>{tr(l, 'ui.costSplit')}</Heading>
            <View style={s.grid}>
              <Field label={tr(l, 'ui.materials')} value={p.split.materials} onChange={(value) => setSplit('materials', value)} symbol={st.symbol} />
              <Field label={tr(l, 'ui.packaging')} value={p.split.packaging} onChange={(value) => setSplit('packaging', value)} symbol={st.symbol} />
              <Field label={tr(l, 'ui.fees')} value={p.split.fees} onChange={(value) => setSplit('fees', value)} symbol={st.symbol} />
            </View>
          </View>
          <View style={s.card}>
            <Heading level={3}>{tr(l, 'ui.scenarios')}</Heading>
            {p.scenarios.map((value, index) => {
              const scenario = scenarioCalc(p.numbers, value, p.split);
              return <View key={index} style={s.scenario}>
                <Field label={String(index + 1)} value={value} onChange={(next) => { const scenarios = [...p.scenarios]; scenarios[index] = next; setProject({...p, scenarios}); }} symbol={st.symbol} />
                {value ? <View style={s.grid}><Metric label={tr(l, 'ui.unit')} value={money(scenario.perUnit, st.symbol)} /><Metric label={tr(l, 'ui.hour')} value={money(scenario.perHour, st.symbol)} /></View> : null}
              </View>;
            })}
          </View>
        </> : <View style={s.lockedPreview}>
          <Text style={s.kicker}>{tr(l, 'ui.lockedPreview')}</Text>
          <Heading level={3}>{tr(l, 'ui.detailedCostsPreview')}</Heading>
          <View style={s.previewBars}><View style={s.previewBarWide} /><View style={s.previewBar} /><View style={s.previewBarShort} /></View>
          <Text style={s.body}>{tr(l, 'ui.unlockDetailedCosts')}</Text>
          <Button text={tr(l, 'ui.unlockShort')} onPress={pay} outline />
        </View>}
        <View style={[s.verdict, result.leftover <= 0 && s.verdictLoss, result.leftover > 0 && s.cardShadow]}>
          <Text style={s.small}>{tr(l, 'ui.left')}</Text>
          <AnimatedMoney value={result.leftover} symbol={st.symbol} loss={result.leftover <= 0} />
          <Text style={s.verdictText}>{verdict}</Text>
          <Text style={s.body}>{result.leftover > 0 ? tr(l, 'ui.verdictProfit', {left: money(result.leftover, st.symbol), hour: money(result.perHour, st.symbol)}) : result.leftover === 0 ? tr(l, 'ui.verdictEven') : tr(l, 'ui.verdictLoss', {left: money(Math.abs(result.leftover), st.symbol)})}</Text>
        </View>
        <View style={s.grid}>
          <Metric label={tr(l, 'ui.unit')} value={money(result.perUnit, st.symbol)} />
          <Metric label={tr(l, 'ui.hour')} value={money(result.perHour, st.symbol)} />
          <Metric label={tr(l, 'ui.breakEven')} value={String(result.breakEven)} />
        </View>
        <Text style={s.helper}>{tr(l, 'ui.batchDisclaimer')}</Text>
        <Button text={tr(l, 'ui.finish')} onPress={finish} />
        <LinkButton text={tr(l, 'ui.editBatch')} onPress={() => setStage('log')} />
      </>}
      <Modal visible={Boolean(viewer)} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={s.photoViewerShade}>
          <Pressable accessibilityRole="button" accessibilityLabel={tr(l, 'ui.closePhoto')} onPress={() => setViewer(null)} style={s.photoViewerClose}><Text style={s.photoViewerCloseText}>×</Text></Pressable>
          {viewer ? <Image source={{uri: viewer}} resizeMode="contain" style={s.photoViewerImage} /> : null}
        </View>
      </Modal>
    </Page>
  );
}
export function History({st, repeat, exportPdf, exportBackup}: {st: State; repeat: (project: Project) => void; exportPdf: (project: Project) => void; exportBackup: (project: Project) => void}) {
  const l = st.locale;
  return (
    <Page>
      <Heading>{tr(l, 'ui.history')}</Heading>
      {st.history.length ? st.history.map((project) => {
        const result = calc(project.numbers, project.split);
        return <View key={project.id} style={[s.historyCard, s.cardShadow]}>
          <Image source={project.photos?.length ? {uri: project.photos[Math.min(project.coverPhotoIndex || 0, project.photos.length - 1)]} : hobbyVisual(project.hobbyId)} resizeMode="cover" style={s.historyThumb} />
          <View style={s.historyBody}>
            <Heading level={2}>{hobbyName(project.hobbyId, l)}</Heading>
            <View style={s.historyMetrics}>
              <Text style={[s.historyMetricStrong, result.leftover <= 0 && s.historyMetricLoss]}>{money(result.leftover, st.symbol)}</Text>
              <Text style={s.small}>{tr(l, 'ui.hour')}: {money(result.perHour, st.symbol)}</Text>
            </View>
            <View style={s.historyActions}>
              <LinkButton text={tr(l, 'ui.repeat')} onPress={() => repeat(project)} />
              <LinkButton text={tr(l, 'ui.exportPdf')} onPress={() => exportPdf(project)} />
              <LinkButton text={tr(l, 'ui.exportJson')} onPress={() => exportBackup(project)} />
            </View>
          </View>
        </View>;
      }) : <Text style={s.body}>{tr(l, 'ui.emptyHistory')}</Text>}
    </Page>
  );
}

export function Compare({st}: {st: State}) {
  const l = st.locale;
  const [selected, setSelected] = useState<string[]>([]);
  const chosen = useMemo(() => selected.map((id) => st.history.find((project) => project.id === id)).filter(Boolean) as Project[], [selected, st.history]);
  if (st.history.length < 2) return <Page><Heading>{tr(l, 'ui.compare')}</Heading><Text style={s.body}>{tr(l, 'ui.needTwo')}</Text></Page>;
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
  return (
    <Page>
      <Heading>{tr(l, 'ui.compare')}</Heading>
      <View style={s.chipWrap}>
        {st.history.map((project) => {
          const on = selected.includes(project.id);
          return <Pressable accessibilityRole="checkbox" accessibilityState={{checked: on}} key={project.id} onPress={() => toggle(project.id)} style={[s.chip, on && s.chipOn]}><Text style={[s.chipText, on && s.chipOnText]}>{hobbyName(project.hobbyId, l)}</Text></Pressable>;
        })}
      </View>
      <View style={s.compareGrid}>
        {chosen.map((project) => {
          const result = calc(project.numbers, project.split);
          return <View key={project.id} style={[s.compareCard, s.cardShadow]}>
            <Image source={project.photos?.length ? {uri: project.photos[Math.min(project.coverPhotoIndex || 0, project.photos.length - 1)]} : hobbyVisual(project.hobbyId)} resizeMode="cover" style={s.compareImage} />
            <Heading level={3}>{hobbyName(project.hobbyId, l)}</Heading>
            <Text style={[s.historyMetricStrong, result.leftover <= 0 && s.historyMetricLoss]}>{money(result.leftover, st.symbol)}</Text>
            <Text style={s.small}>{tr(l, 'ui.cost')}: {money(result.cost, st.symbol)}</Text>
            <Text style={s.small}>{tr(l, 'ui.unit')}: {money(result.perUnit, st.symbol)}</Text>
            <Text style={s.small}>{tr(l, 'ui.hour')}: {money(result.perHour, st.symbol)}</Text>
          </View>;
        })}
      </View>
    </Page>
  );
}

export function Settings({st, setSt, restore, pay, managePrivacy}: {st: State; setSt: React.Dispatch<React.SetStateAction<State>>; restore: () => void; pay: () => void; managePrivacy: () => void}) {
  const l = st.locale;
  const symbols = ['', '$', '€', '£', '₫', '¥', '₹', '₩'];
  return (
    <Page>
      <Heading>{tr(l, 'ui.settings')}</Heading>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.language')}</Heading>
        <View style={s.chipWrap}>{locales.map((locale) => <Pressable accessibilityRole="radio" accessibilityState={{checked: st.locale === locale}} key={locale} onPress={() => setSt((current) => ({...current, locale: locale as LocaleCode}))} style={[s.chip, st.locale === locale && s.chipOn]}><Text style={[s.chipText, st.locale === locale && s.chipOnText]}>{localeName(locale)}</Text></Pressable>)}</View>
      </View>
      <View style={s.card}>
        <Heading level={3}>{tr(l, 'ui.symbol')}</Heading>
        <View style={s.chipWrap}>{symbols.map((symbol) => <Pressable accessibilityRole="radio" accessibilityState={{checked: st.symbol === symbol}} key={symbol || 'none'} onPress={() => setSt((current) => ({...current, symbol}))} style={[s.chip, st.symbol === symbol && s.chipOn]}><Text style={[s.chipText, st.symbol === symbol && s.chipOnText]}>{symbol || tr(l, 'ui.none')}</Text></Pressable>)}</View>
      </View>
      <View style={s.pale}><Text style={s.body}>{tr(l, 'ui.local')}</Text><Text style={s.body}>{tr(l, 'ui.noAccount')}</Text></View>
      {!st.premium ? <View style={s.pale}><Text style={s.kicker}>{tr(l, 'ui.unlockKicker')}</Text><Heading level={3}>{tr(l, 'ui.lifetime')}</Heading><Text style={s.body}>{tr(l, 'ui.settingsUpgradeBody')}</Text><Button text={tr(l, 'ui.buy')} onPress={pay} /></View> : <View style={s.pale}><Text style={s.kicker}>{tr(l, 'ui.lifetimeActive')}</Text><Text style={s.body}>{tr(l, 'ui.noAdsActive')}</Text></View>}
      <View style={s.card}>
        <LinkButton text={tr(l, 'ui.restore')} onPress={restore} />
        <LinkButton text={tr(l, 'ui.support')} onPress={() => Linking.openURL(`${SITE}/support`)} />
        <LinkButton text={tr(l, 'ui.privacy')} onPress={() => Linking.openURL(`${SITE}/privacy`)} />
        {!st.premium ? <LinkButton text={tr(l, 'ui.privacyChoices')} onPress={managePrivacy} /> : null}
        <LinkButton text={tr(l, 'ui.terms')} onPress={() => Linking.openURL(`${SITE}/terms`)} />
        <LinkButton text={tr(l, 'ui.deleteData')} onPress={() => Alert.alert(tr(l, 'ui.deleteTitle'), tr(l, 'ui.deleteBody'), [{text: tr(l, 'ui.cancel'), style: 'cancel'}, {text: tr(l, 'ui.delete'), style: 'destructive', onPress: async () => { await clearAll(); setSt((current) => ({...current, project: null, history: []})); }}])} />
      </View>
    </Page>
  );
}
