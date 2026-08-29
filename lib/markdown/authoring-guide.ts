const markdownAuthoringGuideBody = String.raw`
## 먼저 지킬 원칙

> [!NOTE] 제목은 별도 입력란에
> 문서 제목은 관리자 화면의 Title에 입력합니다. 본문은 ##부터 시작하면 문서 구조가 겹치지 않습니다.

- 문단 하나에는 주제 하나만 담습니다.
- 꾸미기보다 정보의 관계를 보여줄 때 확장 문법을 사용합니다.
- 링크는 가능하면 HTTPS를 사용하고, 이미지는 내용을 설명하는 대체 텍스트를 반드시 적습니다.
- 작성 중에는 Preview에서 표의 가로 스크롤, 수식, 다이어그램을 확인합니다.

---

## 제목과 문단

**언제 쓰나요?** 긴 문서를 빠르게 훑을 수 있도록 내용을 구획할 때 씁니다. 큰 구획은 ##, 그 안의 항목은 ###, 세부 항목은 #### 순서로 내려갑니다. 제목 단계를 건너뛰지 않습니다.

~~~markdown
## 변경 사항

이번 배포에서 달라진 내용을 한두 문장으로 설명합니다.

### 적용 대상

- 웹 사용자
- API 사용자
~~~

문장은 소스에서 한 줄만 바꿔도 같은 문단으로 이어집니다. 줄을 확실히 나누려면 문단 사이에 빈 줄을 넣습니다. 주제가 크게 바뀔 때만 수평선 세 개를 사용합니다.

---

## 강조와 인라인 요소

**언제 쓰나요?** 읽는 사람이 놓치면 안 되는 짧은 표현, 파일명, 명령어, 변경 전후 상태를 표시할 때 씁니다. 문단 전체를 굵게 만들지는 않습니다.

~~~markdown
**중요한 결론**과 *보조 설명*, ~~더 이상 유효하지 않은 내용~~

HTML로 <mark>검토할 부분</mark>, H<sub>2</sub>O, x<sup>2</sup>, <kbd>Enter</kbd>를 표시할 수 있습니다.
~~~

실제 출력: **중요한 결론**, *보조 설명*, ~~더 이상 유효하지 않은 내용~~, <mark>검토할 부분</mark>, H<sub>2</sub>O, x<sup>2</sup>, <kbd>Enter</kbd>.

명령어나 짧은 식별자는 <code>npm run build</code>처럼 인라인 코드로 표시합니다. 약어의 원문이 필요하면 <abbr title="Application Programming Interface">API</abbr>처럼 작성합니다.

---

## 목록과 체크리스트

**언제 쓰나요?** 순서가 중요하지 않은 항목은 글머리표, 절차는 번호 목록, 완료 상태를 함께 관리할 때는 체크리스트를 사용합니다. 단계가 네 겹 이상이면 제목으로 나누는 편이 읽기 쉽습니다.

~~~markdown
- 변경 내용
  - API 응답 필드 추가
  - 관리자 화면 보강

1. 초안을 저장합니다.
2. 미리보기를 확인합니다.
3. 발행합니다.

- [x] 기술 검토
- [ ] 발행 승인
~~~

- [x] 검토가 끝난 항목
- [ ] 아직 확인할 항목

---

## 표

**언제 쓰나요?** 같은 속성을 가진 항목을 비교하거나, 설정값과 상태를 나란히 보여줄 때 씁니다. 긴 설명이나 단계별 절차는 표보다 제목과 목록이 낫습니다. 좁은 화면에서는 표 영역만 가로로 스크롤됩니다.

~~~markdown
| 항목 | 상태 | 비고 |
| :--- | :---: | ---: |
| API | 운영 | v2 |
| Dashboard | 준비 | 80% |
~~~

| 항목 | 상태 | 비고 |
| :--- | :---: | ---: |
| API | 운영 | v2 |
| Dashboard | 준비 | 80% |

---

## 링크와 이미지

**언제 쓰나요?** 원문, 관련 공지, 저장소처럼 독자가 다음 행동을 할 수 있는 위치를 연결할 때 씁니다. 링크 문구는 ‘여기’보다 목적지를 설명하도록 작성합니다.

~~~markdown
[API 변경 기록](https://example.com/changelog)
[문서 안의 표로 이동](#표)
[문의하기](mailto:contact@laflabs.co)

![관리자 대시보드의 사용량 화면](https://example.com/dashboard.png)
![LafLabs 로고](/laflabs-logo.png)
~~~

- 외부 이미지는 HTTPS만 허용합니다. 같은 사이트의 이미지는 /로 시작하는 경로도 사용할 수 있습니다.
- 이미지 대체 텍스트가 비어 있으면 발행할 수 없습니다. 화면에 보이는 모양이 아니라 이미지가 전달하는 정보를 적습니다.
- 실행 가능한 주소와 위험한 HTML은 렌더링 과정에서 제거됩니다.

---

## 인용문

**언제 쓰나요?** 외부 문서나 인터뷰의 문장을 그대로 인용할 때 씁니다. 운영 안내나 주의 사항은 일반 인용문보다 아래의 콜아웃을 사용합니다.

~~~markdown
> 원문의 문장을 인용합니다.
>
> 출처와 맥락은 인용문 밖에서 설명합니다.
~~~

> 원문의 문장을 인용합니다. 출처와 맥락은 인용문 밖에서 설명합니다.

---

## 콜아웃

**언제 쓰나요?** 본문 흐름을 멈추고도 반드시 구분해야 하는 참고 정보, 권장 사항, 결과, 위험을 표시합니다. 한 화면에 여러 개를 연달아 배치하면 강조 효과가 약해집니다.

| 종류 | 쓰기 좋은 상황 |
| --- | --- |
| NOTE | 배경이나 전제 |
| INFO | 사양, 범위, 참고 정보 |
| TIP | 더 나은 방법이나 권장 설정 |
| SUCCESS | 완료 결과나 정상 상태 |
| WARNING | 실행 전에 확인할 조건 |
| DANGER | 데이터 손실, 보안, 되돌리기 어려운 작업 |

~~~markdown
> [!WARNING] 배포 전 확인
> 데이터베이스 마이그레이션을 먼저 적용하세요.
~~~

> [!WARNING] 배포 전 확인
> 데이터베이스 마이그레이션을 먼저 적용하세요.

콜아웃 이름은 NOTE, INFO, TIP, SUCCESS, WARNING, DANGER 중 하나를 대문자로 입력합니다. 뒤에 제목을 생략하면 종류 이름이 제목으로 표시됩니다.

---

## 코드

**언제 쓰나요?** 명령어, 설정, API 예시처럼 그대로 복사해 실행하거나 비교해야 하는 내용을 보여줄 때 씁니다. 코드 블록의 첫 줄에 언어를 적으면 문법 강조와 언어 이름이 적용되고 복사 버튼이 나타납니다.

~~~~markdown
~~~typescript
type Release = {
  version: string
  stable: boolean
}

const release: Release = { version: "2.0.0", stable: true }
~~~
~~~~

~~~typescript
type Release = {
  version: string
  stable: boolean
}

const release: Release = { version: "2.0.0", stable: true }
~~~

권장 언어 이름은 javascript, typescript, python, bash, shell, json, sql, yaml, diff입니다. 언어를 모르면 비워 두면 됩니다. 코드 안에 펜스가 들어갈 때는 바깥 펜스를 더 길게 쓰거나 물결표 펜스를 사용합니다.

---

## 수식

**언제 쓰나요?** 기술 문서에서 변수 관계나 계산식을 정확하게 전달할 때 씁니다. 간단한 기호를 꾸미기 위해 사용하지 않습니다.

~~~markdown
인라인 수식은 $E = mc^2$처럼 문장 안에 둡니다.

$$
A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$
~~~

인라인 수식은 $E = mc^2$처럼 문장 안에 둡니다.

$$
A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$

- 블록 수식은 달러 기호 두 개로 열고 닫으며, 구분자 앞뒤에는 빈 줄을 둡니다.
- 여러 줄을 정렬할 때는 aligned, 행렬은 bmatrix를 사용합니다.
- 관리자 입력란에서는 LaTeX의 역슬래시를 그대로 한 번만 입력합니다.

---

## Mermaid 다이어그램

**언제 쓰나요?** 요청 흐름, 시스템 간 통신, 상태 전환, 일정처럼 글만으로 관계를 파악하기 어려울 때 씁니다. 장식용 도형보다 구조를 설명하는 데 집중합니다.

~~~~markdown
~~~mermaid
flowchart LR
  Draft[초안] --> Review{검토}
  Review -->|승인| Published[발행]
  Review -->|수정| Draft
~~~
~~~~

~~~mermaid
flowchart LR
  Draft[초안] --> Review{검토}
  Review -->|승인| Published[발행]
  Review -->|수정| Draft
~~~

flowchart, sequenceDiagram, stateDiagram-v2, classDiagram, erDiagram, gantt, timeline, pie 등을 사용할 수 있습니다. 벤 다이어그램은 Mermaid 기본 문법이 아니므로 이미지로 첨부하거나 flowchart로 관계를 다시 표현합니다.

---

## 접는 영역과 허용 HTML

**언제 쓰나요?** 긴 로그, 부가 설명, 선택적으로 확인할 예시를 기본 화면에서 접어 둘 때 details를 씁니다. 핵심 결론이나 법적 고지는 접지 않습니다.

~~~markdown
<details>
<summary><strong>접어서 둘 내용</strong></summary>

펼친 뒤에만 읽어도 되는 부가 설명입니다.

- 목록과 **강조**도 사용할 수 있습니다.

</details>
~~~

<details>
<summary><strong>접어서 둘 내용</strong></summary>

펼친 뒤에만 읽어도 되는 부가 설명입니다.

- 목록과 **강조**도 사용할 수 있습니다.

</details>

mark, sub, sup, kbd, abbr, details, summary 같은 안전한 HTML 요소를 지원합니다. script, iframe, style과 이벤트 속성은 사용할 수 없습니다. 레이아웃을 HTML로 직접 조립하기보다 기본 Markdown을 우선합니다.

---

## 지원 범위와 대안

- YAML 프런트매터는 사용하지 않습니다. 제목, 문서 종류, 언어, 카테고리, 날짜는 관리자 화면의 전용 입력란에 적습니다.
- 각주와 정의 목록은 전용 서식으로 변환되지 않습니다. 짧은 보충 설명은 괄호나 NOTE 콜아웃으로, 용어 설명은 표나 소제목으로 정리합니다.
- H~2~O와 x^2^ 같은 확장 표기는 지원하지 않습니다. 아래첨자와 위첨자는 sub, sup HTML 요소를 사용합니다.
- 임의의 색상, 스크립트, iframe, 이벤트 속성은 안전을 위해 제거됩니다.
- 다이어그램이 렌더링되지 않으면 문법을 단순화하고 Preview에서 다시 확인합니다. 꼭 필요한 그림은 의미 있는 대체 텍스트와 함께 이미지로 첨부합니다.

---

## 발행 전 확인

- [ ] 본문은 ##부터 시작했고 제목 단계가 순서대로 이어지는가?
- [ ] Summary는 본문의 결론을 한 줄로 설명하는가?
- [ ] 링크 문구만 읽어도 목적지를 알 수 있는가?
- [ ] 모든 이미지에 의미 있는 대체 텍스트가 있는가?
- [ ] 표, 수식, Mermaid가 모바일 폭의 Preview에서도 읽히는가?
- [ ] 콜아웃과 강조를 꼭 필요한 곳에만 사용했는가?
- [ ] 코드의 언어 이름과 복사 결과를 확인했는가?

> [!TIP] Preview가 최종 기준입니다
> 문법이 애매하면 발행 전에 Preview에서 실제 출력과 모바일 가로 스크롤을 확인하세요.
`

const markdownAuthoringGuideIntroduction = String.raw`> [!INFO] AI에게 요청할 때
> 이 문서는 LafLabs 문서 본문의 작성 규칙입니다. AI에게 https://laflabs.co/markdown-guide.md 주소와 작성 목적을 함께 전달하세요. AI는 Title, Summary, Kind, Locale 같은 관리자 필드를 본문에 넣지 않고, 결과 본문을 ##부터 시작해야 합니다.`

export const markdownAuthoringGuideSource = `${markdownAuthoringGuideIntroduction}\n\n${markdownAuthoringGuideBody}`

export const markdownAuthoringGuideDocument = `# LafLabs Markdown 작성 가이드\n\n${markdownAuthoringGuideSource}`

export const markdownGuideSections = [
  ["먼저 지킬 원칙", "#먼저-지킬-원칙"],
  ["제목과 문단", "#제목과-문단"],
  ["표", "#표"],
  ["콜아웃", "#콜아웃"],
  ["코드", "#코드"],
  ["수식", "#수식"],
  ["Mermaid", "#mermaid-다이어그램"],
  ["지원 범위", "#지원-범위와-대안"],
  ["발행 전 확인", "#발행-전-확인"],
] as const
