# RNW 뉴스 요약 섹션 파일 배치

루트 예: `C:/workspace/personal/ddal-kkak-front`

```
app/
  _layout.tsx        # expo-router 레이아웃
  index.tsx          # 홈
  news/
    index.tsx        # 뉴스 요약 화면
src/
  shared/
    useNewsData.ts   # 더미 데이터/타입
    date.ts          # 날짜 유틸
```

## 설치/실행
```bash
npx expo install expo-router react-native-web react-dom
# 루트에 babel.config.js 존재 필수 (예: presets: ['babel-preset-expo'])
npm run web     # 또는 npx expo start --web
```
