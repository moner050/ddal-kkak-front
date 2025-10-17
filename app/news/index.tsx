import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useNewsData, NEWS_CATEGORIES, NewsItem } from '@/shared/useNewsData';
import { formatDateOnly, getYesterdayToday } from '@/shared/date';
import * as Linking from 'expo-linking';

function Chip({ active, label, onPress }: { active: boolean, label: string, onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ marginRight: 8, marginBottom: 8, borderRadius: 9999, borderWidth: 1, borderColor: active ? '#4f46e5' : '#e5e7eb', backgroundColor: active ? '#eef2ff' : '#fff', paddingHorizontal: 12, paddingVertical: 8 }}>
      <Text style={{ color: active ? '#4338ca' : '#374151', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function NewsCard({ item, onOpen }: { item: NewsItem, onOpen: (n: NewsItem) => void }) {
  return (
    <Pressable onPress={() => onOpen(item)} style={{ backgroundColor: 'white', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, marginRight: 6, color: '#374151', fontSize: 12 }}>{item.category}</Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginRight: 6 }}>{formatDateOnly(item.date)}</Text>
          <Text style={{ backgroundColor: item.importance >= 8 ? '#ffe4e6' : item.importance >= 5 ? '#fef3c7' : '#f3f4f6', color: item.importance >= 8 ? '#be123c' : item.importance >= 5 ? '#92400e' : '#374151', borderWidth: 1, borderColor: item.importance >= 8 ? '#fecdd3' : item.importance >= 5 ? '#fde68a' : '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, fontSize: 12 }}>중요도 {item.importance}/10</Text>
        </View>
      </View>
      <Text style={{ marginTop: 6, fontSize: 16, fontWeight: '700', color: '#111827' }} numberOfLines={2}>{item.title}</Text>
      <Text style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }} numberOfLines={3}>{item.reason}</Text>
    </Pressable>
  );
}

export default function NewsScreen() {
  const all = useNewsData();
  const [cat, setCat] = useState<string>('전체');
  const [sort, setSort] = useState<'date' | 'importance'>('date');
  const [{ start, end }, setRange] = useState(() => getYesterdayToday());
  const [query, setQuery] = useState('');
  const [modalItem, setModalItem] = useState<NewsItem | null>(null);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    const inDate = (d: string) => {
      const only = d.slice(0, 10);
      return only >= start && only <= end;
    };
    const base = all
      .filter(n => (cat === '전체' ? true : n.category === cat))
      .filter(n => inDate(n.date))
      .filter(n => !query || (norm(n.title + ' ' + (n.summary ?? '') + ' ' + (n.body ?? '')).includes(norm(query))));

    const cmp = (a: NewsItem, b: NewsItem) => {
      if (sort === 'date') {
        const pd = b.date.localeCompare(a.date);
        return pd || (b.importance - a.importance);
      } else {
        const pi = b.importance - a.importance;
        return pi || b.date.localeCompare(a.date);
      }
    };
    return base.sort(cmp);
  }, [all, cat, sort, start, end, query]);

  const grouped = useMemo(() => {
    if (cat !== '전체') return { [cat]: filtered };
    return filtered.reduce((acc: Record<string, NewsItem[]>, it) => {
      if (!acc[it.category]) acc[it.category] = [];
      acc[it.category].push(it);
      return acc;
    }, {} as Record<string, NewsItem[]>);
  }, [filtered, cat]);

  const top5 = useMemo(() => {
    return [...all].sort((a,b)=> (b.importance - a.importance) || b.date.localeCompare(a.date)).slice(0,5);
  }, [all]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>뉴스 요약</Text>
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>카테고리 · 날짜 범위 · 정렬 · 검색</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 16 }}>
          {NEWS_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>

        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>정렬</Text>
          <Chip label="날짜" active={sort==='date'} onPress={() => setSort('date')} />
          <Chip label="중요도" active={sort==='importance'} onPress={() => setSort('importance')} />

          <View style={{ height: 12, width: 12 }} />

          <Text style={{ fontSize: 12, color: '#6b7280', marginRight: 8 }}>기간</Text>
          <TextInput
            value={start}
            onChangeText={(t)=>setRange((r)=>({ ...r, start: t }))}
            placeholder="YYYY-MM-DD"
            style={{ borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginRight: 8, minWidth: 120 }}
          />
          <Text style={{ color: '#6b7280' }}>~</Text>
          <TextInput
            value={end}
            onChangeText={(t)=>setRange((r)=>({ ...r, end: t }))}
            placeholder="YYYY-MM-DD"
            style={{ borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 8, minWidth: 120 }}
          />

          <View style={{ height: 12, width: 12 }} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="검색: 제목/요약"
            style={{ flexGrow: 1, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          />
        </View>
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>오늘의 TOP 5</Text>
          </View>
          <View>
            {top5.map((n) => (
              <Pressable key={n.id} onPress={() => setModalItem(n)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, marginRight: 6, color: '#374151', fontSize: 11 }}>{n.category}</Text>
                    <Text style={{ color: '#6b7280', fontSize: 11, marginRight: 6 }}>{formatDateOnly(n.date)}</Text>
                    <Text style={{ backgroundColor: n.importance >= 8 ? '#ffe4e6' : n.importance >= 5 ? '#fef3c7' : '#f3f4f6', color: n.importance >= 8 ? '#be123c' : n.importance >= 5 ? '#92400e' : '#374151', borderWidth: 1, borderColor: n.importance >= 8 ? '#fecdd3' : n.importance >= 5 ? '#fde68a' : '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, fontSize: 11 }}>중요도 {n.importance}/10</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{n.title}</Text>
                  <Text style={{ marginTop: 2, fontSize: 11, color: '#6b7280' }} numberOfLines={2}>{n.reason}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 16, paddingBottom: 24 }}>
        {Object.entries(grouped).map(([gcat, arr]) => (
          <View key={gcat} style={{ marginBottom: 12 }}>
            {cat === '전체' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{gcat} <Text style={{ fontSize: 12, fontWeight: '400', color: '#6b7280' }}>· {arr.length}건</Text></Text>
              </View>
            )}
            <View style={{ gap: 8 }}>
              {arr.map((n) => (
                <NewsCard key={n.id} item={n} onOpen={setModalItem} />
              ))}
            </View>
          </View>
        ))}
      </View>

      <Modal visible={!!modalItem} transparent animationType="fade" onRequestClose={()=>setModalItem(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 560, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{modalItem?.title}</Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>{modalItem ? formatDateOnly(modalItem.date) : ''}</Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: '#374151' }}>{modalItem?.summary ?? ''}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', columnGap: 8, marginTop: 16 }}>
              <Pressable onPress={()=>setModalItem(null)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'white' }}>
                <Text style={{ color: '#374151', fontWeight: '600' }}>닫기</Text>
              </Pressable>
              <Pressable
                disabled={!modalItem?.link || modalItem?.link === '#'}
                onPress={() => { if (modalItem?.link && modalItem.link !== '#') Linking.openURL(modalItem.link); }}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: (!modalItem?.link || modalItem?.link === '#') ? '#e5e7eb' : '#4f46e5' }}
              >
                <Text style={{ color: (!modalItem?.link || modalItem?.link === '#') ? '#6b7280' : 'white', fontWeight: '700' }}>원문보기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
