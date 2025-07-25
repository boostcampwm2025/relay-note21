# week 1

## 토론배경

우리는 AI를 자주 쓰지만, "AI가 정말 이해하고 답하는 걸까?"라는 의문을 항상 가지고 있었습니다.  
특히 말투나 표현을 조금만 바꿔도 다른 답이 나오는 경우가 있어, AI의 언어 이해 한계를 실험해보고 싶었습니다.

이번 주차에서는 다음 질문에 집중했습니다:

- 반말/존댓말/사투리를 AI가 똑같이 인식할 수 있을까?
- 같은 질문을 다르게 표현하면 같은 대답이 나올까?
- AI는 내가 정리한 학습 내용을 ‘제대로’ 요약할 수 있을까?

## 브레인 스토밍

- ai한테 반말 해보기
  - 반말로 물어볼 때, 존댓말로 물어볼 때의 답변 비교.
- 아는 것과 모르는 것 분류하기.
- 오늘 과제를 보고, 뭘 검색했으면 좋겠는지 알려달라고 하기.
- ai로 학습 정리한 거 -> 요약 정리해서 분석해달라고 하기.
- 서울, 위도/경도, 주소 등등 물어볼 수 있는 방법이 많은데, 각 방식의 답변 퀄리티 비교.
- 복잡한 중의적 표현 질문하기
- 의도적으로 오탈자가 포함된 질문하기

## week1 미션

1. 말투에 따른 AI 반응 비교
   : 같은 질문을 존댓말, 반말, 비격식적인 표현(줄임말, 신조어 등)으로 각각 입력했을 때 AI의 답변을 비교 분석합니다.
2. 동일 질문 반복 실험
   : 같은 질문을 시간차, 문맥 변화 등 다양한 상황에서 반복 입력하여 일관성 있는 응답이 돌아오는지 확인합니다.
3. 논리적 오류 식별 실험
   : 일부러 잘못된 사실 정보, 혹은 논리적 오류가 포함된 질문을 입력하여, AI가 이 오류를 식별해낼 수 있는지 확인합니다.
4. 학습 요약 분석 실험
   : 특정 주제에 대한 팀원의 학습 내용을 AI에게 입력하고 이를 요약해달라 요청한 후, 요약이 잘 이루어졌는지, 추가되거나 빠진 내용은 없는지 확인합니다.

## 위의 퀘스트를 선택한 이유 (자료조사)

1. 말투

- https://www.aipostkorea.com/news/articleView.html?idxno=7462#google_vignette
- Meta & Google → ‘훈계조(preachy)’ 톤 제거 실험
  Google과 Meta는 AI 챗봇이 도덕적 설교나 훈계조로 들리지 않도록, 훈계성 표현을 제
  거하는 실험을 진행했습니다.
- Waseda University / RIKEN AIP 연구 – 예의와 AI 응답 품질
  Waseda대와 RIKEN AIP의 공동 연구에서, 정중한 표현이 AI 응답의 정확성과 친절도를 높인다는 결과를 도출했습니다.

2. 동일 질문 반복

   - "똑같은 질문을 반복하다보면 AI도 지치는지 비슷한 답을 계속 내놓습니다."
   - https://blog.naver.com/purpl05/223377975158

3. 할루시네이션
   - https://www.donga.com/news/It/article/all/20240329/124227094/1
   - 생성형 AI의 최대 난제, '할루시네이션'

## Week2 (Team 16)

### J238 정광석

#### 선택한 퀘스트 : 4 학습 요약 분석 실험.

- 특정 주제에 대한 팀원의 학습 내용을 AI에게 입력, 이를 요약해달라 요청 후, 요약이 잘 이루어졌는지, 추가되거나 빠진 내용은 없는지 확인.

일단 Gist 전체를 ctrl + a를 이용해서 복사하는 것이 보안/실용성 측면에서 가장 나은 선택이라 생각했다.

단순히 LLM에 복사 붙여 넣기만 해도 어느 정도 분석하고, 결과를 출력하는 것을 쉽게 확인할 수 있었다.

여기서 더 개선하기 위해 프롬프트를 구체화 하기로 생각

다음과 같은 프롬프트를 작성할 수 있었다.

```
다음은 GitHub Gist 전체 내용입니다. 다양한 파일로 구성되어 있으며, 각각의 역할이 다릅니다. 아래 내용을 파일 단위로 분석해서 다음 기준에 맞춰 요약해 주세요:

1. 각 파일의 기능 및 역할
2. 중요한 클래스 및 메서드 설명
3. 전체 코드 구조 및 흐름 요약
4. 의도한 학습 주제 및 실험 목적과의 연관성 설명
5. 주요 개념이 어떤 코드에 반영되었는지 예시와 함께 설명
6. 중복되거나 불필요한 로직, 개선할 여지가 있는 부분이 있다면 간단한 피드백도 주세요.
7. 각 파트별로 <details><summary>접기/펼치기</summary> 접은 내용(ex 소스 코드)</details> 를 이용하여 접고 펼칠 수 있게 해주세요.
```

- 해당 프롬프트 뒤에 Ctrl + a 로 복사한 Gist 전체를 붙여 넣으면 된다.

여기서 끝내면

- 특정 주제에 대한 팀원의 학습 내용을 AI에게 입력, 이를 요약해달라 요청 후, 요약이 잘 이루어졌는지, 추가되거나 빠진 내용은 없는지 확인.

이라는 주제에 대해 어느 정도 커버가 가능하다.

조금 더 릴레이 프로젝트의 취지에 맞도록 추가적인 프롬프트를 작성한다.

### 1. 성장형 코드 리뷰

```
다음은 내가 직접 작성한(또는 실습한) 코드입니다.
개발자로서 실력을 키우기 위해 다음 기준으로 분석과 피드백을 부탁드립니다:

1. 초급/중급/고급 개발자 입장에서 봤을 때 내가 어떤 수준인지
2. 이 코드에서 배울 수 있는 개념은 무엇인지
3. 더 좋은 설계나 리팩토링 방향이 있다면 무엇인지
4. 이 실습을 발전시켜 어떤 응용 프로젝트로 이어갈 수 있을지
5. 학습을 위해 어떤 개념이나 키워드를 더 공부하면 좋을지
```

### 2. 리팩토링 코치 프롬프트

```
다음 코드는 처음 학습한 내용을 바탕으로 작성한 버전입니다.
이 코드를 중급 이상 개발자가 리팩토링한다면 어떤 방식으로 개선할 수 있을지 설명해주세요.
특히 다음 항목을 기준으로 구체적인 리팩토링 전략을 제안해주세요:


- 코드 중복 제거
- 클래스/모듈 분리
- 예외 처리 및 안정성 강화
- 테스트 가능성 향상
- 유지보수성 개선
```

### 3. 실전 응용 제안 프롬프트

```
현재 코드는 학습 목적이지만, 이 구조를 바탕으로 간단한 유틸/프로덕트로 발전시킬 수 있는 아이디어를 3개 제안해주세요.
각 아이디어에 대해 다음 항목도 함께 제시해주세요:

- 어떤 실용성을 가지는가?
- 어떤 기술이 추가로 필요할까?
- 어떤 방식으로 배포 또는 연동할 수 있을까?
예: EventManager → 실제 채팅 시스템, 게임 이벤트 처리기, 플러그인 구조의 앱 등으로 확장 가능
```

### 4. 개념 기반 체크리스트 프롬프트

```
이 실습에서 내가 익혀야 할 핵심 개념들을 항목별로 체크리스트로 정리해줘.
각 항목은 다음 내용을 포함해주세요:
- 개념 요약
- 관련된 JS 또는 Node.js 문법
- 내가 작성한 코드에서 그 개념이 어떻게 쓰였는지 예시
- 추가로 학습하면 좋은 문서나 키워드
```

### 5. 학습 회고용 프롬프트

```
다음은 내가 최근 진행한 실습 내용입니다. 이 실습을 기반으로 하루 학습 회고를 정리해주세요.
다음 기준으로 요약해줘:
- 오늘 무엇을 배웠는가?
- 어떤 부분이 이해되지 않았고 왜 그런가?
- 다음에 보완하거나 반복 학습할 부분은?
- 오늘 코드에서 가장 좋았던 점과 아쉬운 점은?
```

### 수행 결과

<details> <summary>📄 수행 결과</summary>
📁 전체 구성 요약
EventManager.js, Event.js: 비동기 이벤트 시스템의 중심 역할

main.js: 동작 테스트 및 시연

Publisher.js, Subscriber.js: 이벤트 발신자/수신자 모델링

RaceCondition.js, FastThread.js, MyThread.js: 멀티 스레드, 레이스 컨디션 실험 코드

학습정리.md, 나만의체크포인트.md: 이론 기반 및 학습 목표 설명

기타: 실행 설정(package.json), 이미지 등

<details> <summary>📄 Event.js</summary>
1. 기능 및 역할
이벤트 정보를 담는 객체 정의 클래스. eventName, sender, userData, isCompleted 속성 포함.

2. 주요 클래스
   js
   복사
   편집
   class Event {
   constructor(name, sender, userData = {}, isCompleted = false) { ... }
   toString() { ... }
   }
3. 구조
   이벤트 이름, 발신자, 사용자 정의 데이터, 완료 여부 저장

문자열 출력 기능 포함

4. 학습 주제 연관성
   비동기 이벤트 구조에서 이벤트 메시지를 전달하는 최소 단위로 작동

5. 주요 개념 반영 예시
   js
   복사
   편집
   new Event("MyEvent", senderObj, { foo: "bar" }, true)
6. 피드백
   this.eventName → this.name으로 toString() 내 오타 수정 필요

</details>
<details> <summary>📄 EventManager.js</summary>
1. 기능 및 역할
Publisher-Subscriber 아키텍처를 관리하는 싱글톤 클래스

2. 주요 메서드 및 설명
   add(subscriber, eventName, sender, handler): 구독자 등록

postEvent(eventName, sender, userData): 이벤트 발행 (sync/async/delay 지원)

remove(subscriber): 구독자 제거

description(): 구독자 조건 리스트

3. 코드 흐름
   add → 내부 Map에 emitter와 함께 등록

postEvent → 조건 매칭 후 emitter.emit() 실행

remove → Map과 이벤트 리스너에서 제거

4. 학습 주제 연관성
   비동기 흐름 제어, 동기/비동기 이벤트 전송 학습에 초점

5. 개념 반영 예시
   js
   복사
   편집
   em.postEvent("ModelDataChanged", albumModel, { mode: "async" });
6. 개선 피드백
   key = String(subscriber) + String(eventName) + String(sender) 는 고유성이 약함 → Symbol 또는 WeakMap 고려

process.domain은 deprecated 예정 → async_hooks 등으로 대체 고려

</details>
<details> <summary>📄 main.js</summary>
1. 기능 및 역할
Publisher, Subscriber 구성 및 EventManager의 실제 실행 예제

2. 주요 흐름
   객체 생성 → 구독 등록 → 이벤트 발행 → 출력 확인

동기/비동기/지연 방식 전부 테스트

3. 코드 구조 요약
   js
   복사
   편집
   em.add(subscriberA, "event1", publisherX, handlerA);
   em.postEvent("event1", publisherX, { mode: "sync" });
4. 학습 연관성
   전체 시스템이 어떻게 작동하는지 시연

이벤트 흐름 및 조건 매칭 방식 테스트

5. 주요 개념 예시
   js
   복사
   편집
   em.postEvent("DidShakeMotion", albumController, { mode: "delay", delay: 1500 });
6. 피드백
   출력이 많으므로, handler 내에서 출력 형식 일관성 개선 필요

테스트 시 console.log가 겹침 → 로그 구분선 추가 권장

</details>
<details> <summary>📄 Publisher.js / Subscriber.js</summary>
1. 기능 및 역할
Publisher: 이벤트를 발행하는 주체

Subscriber: 이벤트를 수신하는 주체

2. 클래스
   js
   복사
   편집
   class Publisher {
   constructor(name) { this.name = name; }
   description() { return `Publisher: ${this.name}`; }
   }

class Subscriber {
constructor(name) { this.name = name; }
description() { return `Subscriber: ${this.name}`; }
} 3. 구조
단순 이름 프로퍼티와 설명 메서드 보유

4. 학습 연관성
   객체 기반 이벤트 흐름에서 실체화된 참여자 모델

5. 피드백
   향후 이벤트 기록(history), 구독 목록 등 부가 기능 확장 가능

</details>
<details> <summary>📄 FastThread.js / MyThread.js</summary>
1. 기능 및 역할
의도적으로 Race Condition 발생시키는 시뮬레이션

setTimeout, await sleep() 기반의 시간차 유도

2. 구조
   반복 루프에서 sharedCounter를 읽고 +1 후 재할당

다양한 딜레이를 주어 충돌 유도

3. 학습 주제 연관성
   싱글 스레드 환경에서도 Race-like Condition 구현 가능성을 실험

Node.js 특성 이해

4. 주요 예시
   js
   복사
   편집
   const before = this.sharedCounter.value;
   await sleep(100);
   this.sharedCounter.value = before + 1;
5. 피드백
   실제 Race Condition 실험에는 worker_threads 또는 Atomics 필요

</details>
<details> <summary>📄 RaceCondition.js</summary>
1. 기능 및 역할
Node.js worker_threads를 활용한 실제 멀티스레드 기반 Race Condition 실험

2. 구조
   메인 스레드: Worker 다수 생성

워커 스레드: sharedBuffer 이용해 카운터 증가

delay 삽입으로 충돌 확률 증가

3. 학습 주제 연관성
   SharedArrayBuffer, Atomics 등을 통한 실전 Race Condition 실험

parentPort 통해 IPC 방식 메시지 수신/전송

4. 예시
   js
   복사
   편집
   const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
   const counter = new Int32Array(sharedBuffer);
5. 피드백
   Atomics.add 사용 시 충돌 없이 처리 가능 → 실험 비교 시 유용

</details>
<details> <summary>📄 package.json</summary>
"type": "module" 설정으로 ES 모듈 지원

메인 파일: ThreadRace.js (현재는 RaceCondition.js로 확인됨)

</details>
<details> <summary>📄 나만의체크포인트.md</summary>
실습 목표 및 기능 요구사항 명확하게 기술됨

학습 목표 정리: EventEmitter, Pub/Sub, Race Condition, IPC 구조 등

</details>
<details> <summary>📄 학습정리.md</summary>
프로세스 vs 스레드, IPC, 동기화, JS에서의 비동기 처리 등 설명

Node.js에서의 멀티스레드와 worker_threads, EventEmitter 학습 정리

정리 수준이 높고 실습과 잘 연동됨

</details>
✅ 종합 요약
요소	요약
주요 기능	비동기 이벤트 매니저 구현 및 레이스 컨디션 실험
구조	EventManager 중심으로 Pub/Sub 패턴 구현, Thread 실험 별도 파일로 분리
학습 주제	이벤트 흐름 제어, 동기/비동기/지연 처리, Race Condition 이해
코드 특징	명확한 역할 분리, 실습 목적에 적합한 샘플 설계

✍️ 개선 피드백 요약
Event 클래스 내 toString() 메서드 오류 수정 필요

EventManager 내 key 생성 방식은 충돌 가능성 존재 → 개선 고려

로그 출력 포맷 개선 시 디버깅 효율 증가

테스트 파일 내 너무 많은 출력은 콘솔 오염 가능성 있음

동기화 실험 시 Atomics의 비교 활용도 고려

</details>
