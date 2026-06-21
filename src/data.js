/* =============================================================================
   筋トレアプリの「単一の真実源（source of truth）」。
   ★ここだけを編集すれば、4セッションのメニュー・進捗・ログがすべて更新される。
     表示（next-session.html）は、このデータを読んで描画するだけ。CSSやタブの仕組みは
     一切触らなくてよいので、毎セッションの更新で画面を壊す心配がない。
   ★window に代入しているのは、file:// で直接開いても（CORSエラーなしで）読めるようにするため。

   ■ セットの書き方（exercises[].sets[] の各要素）
     { label:"M1", weight:"70kg", reps:"6〜8回", rest:"rest 2–3 min" }
       - warm:true   … ウォームアップ（ラベルを淡色に）
       - accent:true … AMRAP / ドロップセット等を強調色に（reps に "AMRAP ★" 等を入れる）
       - rest 省略可
     特殊な種目：
       - superset:{ steps:[...], note:"..." } … スーパーセットの流れ表示
       - subgroups:[{ subhead:"▶ …", sets:[...], tip:"…" }] … 1種目内の小分け（ペックデック＋…）
     各種目に why（なぜこの重量・回数か）と tip（フォームのコツ）を必ず入れる。
   ============================================================================= */
window.KINTORE_DATA = {

  /* プログラム全体のメタ情報。週数・フェーズは日付から自動計算せず、ここに直書きする
     （サイクル切替でズレないように）。トレ報告のたびに weekNow を進める。 */
  meta: {
    programName: "筋肥大プログラム",
    splitName: "4分割（Upper/Lower × A/B）",
    sessionsDone: 3,     // ★これまでに完了した回数（トレ報告のたびに +1）
    sessionsTotal: 36,   // 週3回 × 12週間 ＝ 全36回
    cycleNote: "1周目",  // 今が何周目か
    phaseNote: "Phase 1：まずはフォーム習得と土台づくり。各種目の基準重量に体を慣らし、正しい動きを固める時期。",
    overview: "上半身（Upper）と下半身（Lower）をそれぞれA・Bの2種類で回す4分割。週3回・12週間（全36回）で、各部位を週1.5回ずつ刺激し、筋肥大に必要な頻度を確保する。",
    about: [
      { h: "狙い", p: "重い主役種目で「伸ばし」、補助種目で「維持」。毎回どこかの部位を確実に成長させながら、全身をまんべんなく鍛える。" },
      { h: "なぜ4分割か", p: "1回で全身をやると1部位あたりが薄くなる。上半身・下半身×A/Bに分けることで、その日の集中と十分な休息（同じ部位は中2〜3日空く）を両立できる。" },
      { h: "伸ばし方（2-up rule）", p: "全セットで上限回数を達成したら、次回 +2.5〜5kg。少しずつ重くし続けることが筋肥大の最大の原則。" },
      { h: "進め方（フェーズ）", p: "Phase1＝フォームと土台 → Phase2＝主要種目を増量 → 最後にディロード（軽め）で成長を確定させる。" }
    ],
    defaultTab: "next" // 起動時に開くタブ
  },

  /* ローテーションの順番と、次にやるセッション。トレ後は currentKey を次へ進める。 */
  rotation: ["upperA", "lowerA", "upperB", "lowerB"],
  currentKey: "lowerB",

  sessions: {

    /* ===================== Upper-A ===================== */
    upperA: {
      key: "upperA",
      name: "Upper-A",
      titleJp: "胸・背中メイン",
      lede: "ベンチと懸垂で押す力・引く力を伸ばす上半身の主役日。",
      minutes: 80,
      payoff: [
        { target: "胸", text: "ベンチで胸板に厚みが出て、シャツが前から押し返される。押す力そのものが強くなる。" },
        { target: "背中", text: "懸垂とラットで背中が広がり、上から見たときの逆三角が際立つ。" },
        { target: "姿勢", text: "引く力が育つと肩が後ろに開き、立ち姿が自然と良くなる。" }
      ],
      rule: "全セットで上限回数を達成したら、次回 +2.5〜5kg。",
      exercises: [
        {
          no: "01", name: "バーベルベンチプレス", tag: "胸・メイン",
          sets: [
            { label: "W1", warm: true, weight: "20kg", reps: "12回" },
            { label: "W2", warm: true, weight: "50kg", reps: "5回" },
            { label: "M1", weight: "70kg", reps: "6〜8回", rest: "rest 2–3 min" },
            { label: "M2", weight: "70kg", reps: "6〜8回", rest: "rest 2–3 min" },
            { label: "M3", weight: "70kg", reps: "AMRAP ★", accent: true, rest: "rest 2–3 min" }
          ],
          why: "胸は大きな筋肉で高重量を扱えるので、上半身で最初に置く主役。6〜8回はしっかり重い負荷で筋力・筋肥大の両方を狙える回数域。M3だけ限界（AMRAP）で毎回の伸びを測る。Phase2で75〜80kg、Phase3で80〜90kgへ。",
          tip: "肩甲骨を寄せて下げてから握る。バーは乳首のラインへ。最初の2週は70kg固定でフォーム優先。"
        },
        {
          no: "02", name: "懸垂（自重）", tag: "背中・広がり",
          sets: [
            { label: "W1", warm: true, weight: "アシスト −30kg", reps: "8回" },
            { label: "M1", weight: "自重", reps: "AMRAP ★", accent: true, rest: "rest 2–3 min" },
            { label: "M2", weight: "自重", reps: "AMRAP", accent: true, rest: "rest 2–3 min" },
            { label: "M3", weight: "自重", reps: "AMRAP（出し切る）", accent: true, rest: "rest 2–3 min" }
          ],
          why: "懸垂は背中の「広がり」を作る最良種目。自重で限界まで（AMRAP）行うのは、自重種目は回数で負荷を測るのが合理的だから。3セット全部10回以上できたら、次回からベルトで重りを足して+5kg相当の負荷に。",
          tip: "肩を下げてから引き、胸を張って鎖骨をバーに近づける。反動を使わず背中で引く。"
        },
        {
          no: "03", name: "インクラインマシンプレス", tag: "胸上部・補助",
          sets: [
            { label: "M1", weight: "33.6kg", reps: "8〜12回", rest: "rest 2 min" },
            { label: "M2", weight: "33.6kg", reps: "8〜12回", rest: "rest 2 min" },
            { label: "M3", weight: "33.6kg", reps: "AMRAP ★", accent: true, rest: "rest 2 min" }
          ],
          why: "ベンチで土台を作った後の補助。胸の上部（鎖骨側の盛り上がり）はベンチだけでは入りにくいので、角度をつけて狙う。マシンで安全に8〜12回の中回数で追い込む。慣れたらPhase2で36kgへ。",
          tip: "胸の上部に効いているか意識。肘を開きすぎず、押し切ったら一瞬止める。"
        },
        {
          no: "04", name: "ラットプルダウン<br>or シーテッドロー", tag: "背中・厚み",
          sets: [
            { label: "M1", weight: "77〜82kg", reps: "8〜10回", rest: "rest 2 min" },
            { label: "M2", weight: "77〜82kg", reps: "8〜10回", rest: "rest 2 min" },
            { label: "M3", weight: "77〜82kg", reps: "AMRAP ★", accent: true, rest: "rest 2 min" }
          ],
          why: "懸垂が「広がり」なら、こちらは背中の「厚み」担当。8〜10回でしっかり負荷をかける。懸垂で十分追い込めた日はシーテッドローに替えるなど、交互でもOK。",
          tip: "肩甲骨を寄せて引く。腕で引かず、背中で引く意識。"
        }
      ]
    },

    /* ===================== Lower-A ===================== */
    lowerA: {
      key: "lowerA",
      name: "Lower-A",
      titleJp: "スクワットメイン",
      lede: "スクワットを全種目の最優先に置く、脚の主役日。",
      minutes: 80,
      payoff: [
        { target: "脚全体", text: "スクワットで太もも全体に厚みが出て、下半身の土台が安定する。" },
        { target: "お尻・ハム", text: "RDLで後ろ側を育て、後ろ姿と股関節の強さが増す。" },
        { target: "全身", text: "脚は体で最大の筋肉。ここを鍛えると全身の代謝とホルモン応答が上がる。" }
      ],
      rule: "全セットで上限回数を達成したら、次回 +2.5〜5kg。",
      exercises: [
        {
          no: "01", name: "バーベルスクワット", tag: "脚・最優先",
          sets: [
            { label: "W1", warm: true, weight: "20kg", reps: "12回" },
            { label: "W2", warm: true, weight: "60kg", reps: "5回" },
            { label: "M1", weight: "75kg", reps: "5〜8回", rest: "rest 3 min" },
            { label: "M2", weight: "75kg", reps: "5〜8回", rest: "rest 3 min" },
            { label: "M3", weight: "75kg", reps: "AMRAP ★", accent: true, rest: "rest 3 min" }
          ],
          why: "スクワットは全種目中で最優先。脚という最大の筋肉群を高重量で動かすので、成長への効果が一番大きい。5〜8回の低〜中回数で筋力ベースを上げる。Phase2で80〜85kg、Phase3で87.5〜95kg・4〜6回へ。",
          tip: "全種目中で絶対に手を抜かない一番手。胸を張り、お尻を後ろに引いて深くしゃがむ。"
        },
        {
          no: "02", name: "RDL（ルーマニアンデッドリフト）", tag: "ハム・お尻",
          sets: [
            { label: "W1", warm: true, weight: "60kg", reps: "8回（フォーム確認）" },
            { label: "M1", weight: "70kg", reps: "8〜10回", rest: "rest 2–3 min" },
            { label: "M2", weight: "70kg", reps: "8〜10回", rest: "rest 2–3 min" },
            { label: "M3", weight: "70kg", reps: "AMRAP ★", accent: true, rest: "rest 2–3 min" }
          ],
          why: "スクワットが前側（大腿四頭）中心なのに対し、RDLは後ろ側（ハム・お尻）を補う。Lower-Aでは8〜10回でフォーム習得と土台づくりを優先（Lower-Bでより重く扱う）。",
          tip: "床まで下ろさない。膝を軽く曲げて固定し、お尻を後ろに引く。ハム（太もも裏）が伸びる感覚が正解。"
        },
        {
          no: "03", name: "レッグプレス", tag: "脚・追い込み",
          sets: [
            { label: "M1", weight: "153kg", reps: "12〜15回", rest: "rest 2 min" },
            { label: "M2", weight: "153kg", reps: "12〜15回", rest: "rest 2 min" },
            { label: "M3", weight: "160kg", reps: "AMRAP ★", accent: true, rest: "rest 2 min" }
          ],
          why: "スクワット・RDLで土台を使った後の仕上げ。マシンで安全に12〜15回の高回数を回し、脚に最後の刺激と血流（パンプ）を入れる。スクワット後で軽く感じても正常。",
          tip: "膝は伸ばしきらない。足の位置で効く場所が変わるので、狙いに合わせて調整。"
        },
        {
          no: "04", name: "カーフレイズ（マシン）", tag: "ふくらはぎ",
          sets: [
            { label: "M1–3", weight: "60〜70kg", reps: "20回", rest: "rest 90 sec" }
          ],
          why: "ふくらはぎは日常で常に使う持久的な筋肉なので、20回の高回数でないと効きにくい。重量より可動域をフルに使うのがコツ。",
          tip: "一番下まで伸ばし、一番上で1秒止める。可動域いっぱいに大きく動かす。"
        }
      ]
    },

    /* ===================== Upper-B ===================== */
    upperB: {
      key: "upperB",
      name: "Upper-B",
      titleJp: "肩・腕・背中",
      lede: "肩の丸み・腕の太さ・胸＆後ろ三角筋を補強する上半身の2日目。",
      minutes: 85,
      payoff: [
        { target: "肩", text: "三角筋が丸く張り出し、肩幅が出る。上半身が逆三角形に近づき、立ち姿そのものが変わる。" },
        { target: "腕", text: "二頭の山と三頭の馬蹄で、Tシャツの袖が埋まる太さへ。腕まくりが様になる。" },
        { target: "胸・後ろ", text: "胸の厚みと後部三角の立体感。後ろ姿と姿勢に“強さ”がにじむ。" }
      ],
      rule: "全セットで上限回数を達成したら、次回 +2.5〜5kg。",
      exercises: [
        {
          no: "01", name: "マシンショルダープレス", tag: "肩・メイン",
          sets: [
            { label: "W1", warm: true, weight: "20〜27kg", reps: "12回" },
            { label: "W2", warm: true, weight: "41kg", reps: "5回" },
            { label: "M1", weight: "54kg", reps: "8〜12回", rest: "rest 2–3 min" },
            { label: "M2", weight: "54kg", reps: "8〜12回", rest: "rest 2–3 min" },
            { label: "M3", weight: "54kg", reps: "AMRAP ★", accent: true, rest: "rest 2–3 min" }
          ],
          why: "肩の「丸み」を作る主力。肩は小さめの筋肉なので8〜12回の中回数が効きやすい。M3だけ限界（AMRAP）で伸びを測る。",
          tip: "肩甲骨を下げてから押す。肩が耳に近づくと三角筋でなく僧帽筋に逃げる。"
        },
        {
          no: "02", name: "ケーブルサイドレイズ", tag: "肩横・補助",
          sets: [
            { label: "M1", weight: "7〜9kg", reps: "15〜20回", rest: "rest 90 sec" },
            { label: "M2", weight: "7〜9kg", reps: "15〜20回", rest: "rest 90 sec" },
            { label: "M3", weight: "7〜9kg", reps: "DROP SET ★ 限界→重量↓そのまま続ける", accent: true }
          ],
          why: "肩の「横の張り出し」を作る種目。サイドレイズは軽い重量でも効くので、15〜20回の高回数＋最後はドロップセットで効かせ切る。重量より効かせることが大事。",
          tip: "肘を少し曲げ、小指側から上げる意識。前腕でなく肘を主役にすると三角筋に入る。"
        },
        {
          no: "03 / 04", name: "スーパーセット｜腕", tag: "二頭 + 三頭",
          superset: {
            steps: ["EZバーカール（二頭筋）", "ライングエクステンション（三頭筋）"],
            note: "2〜3分休む　→　× 3セット"
          },
          sets: [
            { label: "カール", weight: "30kg", reps: "8〜12回 ・ M3は AMRAP ★", accent: true, rest: "rest 2–3 min" },
            { label: "伸ばし", weight: "20kg", reps: "8〜12回 ・ M3は AMRAP ★", accent: true }
          ],
          why: "二頭（引く）と三頭（押す）は互いに干渉しないので、休まず交互に行っても質が落ちず時短になる。腕の太さは三頭筋が鍵なので、三頭にもしっかり1種目あてる。",
          tip: "カール：肘を体の横に固定、前腕だけ動かす。ライングエクステンション：肘を頭の上に固定したまま前腕だけ伸ばす。重量より肘の固定優先。"
        },
        {
          no: "05", name: "ペックデック ＋ ハイロー", tag: "必須 × 2",
          subgroups: [
            {
              subhead: "▶ ペックデック（正面向き・胸）",
              sets: [
                { label: "W1", warm: true, weight: "23kg", reps: "12回" },
                { label: "W2", warm: true, weight: "41kg", reps: "5回" },
                { label: "M1–2", weight: "54kg", reps: "12〜15回", rest: "rest 90 sec" },
                { label: "M3", weight: "54kg", reps: "AMRAP ★", accent: true, rest: "rest 90 sec" }
              ],
              tip: "肘を少し曲げたまま固定。腕でなく「胸で閉じる」意識。最大収縮で一瞬止める。"
            },
            {
              subhead: "▶ アイソラテラルハイロー（後部三角筋）",
              sets: [
                { label: "M1–3", weight: "軽め", reps: "15〜20回", rest: "rest 90 sec" }
              ],
              tip: "肘を肩より少し上の高さで引く。引ききったとき肩甲骨を後ろに絞るイメージで止める。"
            }
          ],
          why: "胸を週1.5回、後部三角筋を週1.5回確保するための「2 in 1」。同じマシンを正面・背面で使い分けて時短する。後部三角は普段不足しがちなので意識して入れる。"
        }
      ]
    },

    /* ===================== Lower-B ===================== */
    lowerB: {
      key: "lowerB",
      name: "Lower-B",
      titleJp: "脚 ・ ハム＆お尻",
      lede: "RDLでハム・お尻を重め、スクワットは軽めで維持。レッグプレス＆カーフで仕上げ。",
      minutes: 75,
      payoff: [
        { target: "ハム・お尻", text: "RDLで後ろももとお尻に張りが出て、後ろ姿のラインが引き締まる。股関節が強くなり、全種目の土台になる。" },
        { target: "脚全体", text: "スクワットとレッグプレスで太ももに厚み。ズボンの中が埋まる、地に足のついた脚へ。" },
        { target: "ふくらはぎ", text: "カーフで下腿が締まり、脚全体のバランスが整う。立ち姿・歩き姿に安定感が出る。" }
      ],
      rule: "全セットで上限回数を達成したら、次回 +2.5〜5kg。",
      exercises: [
        {
          no: "01", name: "RDL（ルーマニアンデッドリフト）", tag: "ハム・お尻・メイン",
          sets: [
            { label: "W1", warm: true, weight: "60kg", reps: "8回" },
            { label: "W2", warm: true, weight: "80kg", reps: "3回" },
            { label: "M1", weight: "80〜90kg", reps: "6〜10回", rest: "rest 3 min" },
            { label: "M2", weight: "80〜90kg", reps: "6〜10回", rest: "rest 3 min" },
            { label: "M3", weight: "80〜90kg", reps: "AMRAP ★", accent: true, rest: "rest 3 min" }
          ],
          why: "RDLはハム・お尻という大きな筋肉を使うので高重量を扱える種目。だからこの日の「主役（伸ばす種目）」に置き、Lower-Aより重めにしている。6〜10回は筋肥大に最も効率的とされる回数域で、重い負荷をある程度の回数こなすと筋肉が一番育つ。M3だけAMRAP（限界まで）にして、毎回の伸びを測る。",
          tip: "膝でなく股関節から折る。背中はまっすぐ、バーは脛に沿わせて下ろす。後ろももが伸びるのを感じる位置まで。Lower-AのRDLより重め、Phase2から重量を上げていく。"
        },
        {
          no: "02", name: "バーベルスクワット<br>or ハックスクワット（軽め）", tag: "脚・維持",
          sets: [
            { label: "M1", weight: "70kg", reps: "10〜12回", rest: "rest 2–3 min" },
            { label: "M2", weight: "70kg", reps: "10〜12回", rest: "rest 2–3 min" },
            { label: "M3", weight: "70kg", reps: "AMRAP ★", accent: true, rest: "rest 2–3 min" }
          ],
          why: "同じ日にRDLで脚を追い込むので、スクワットは「今ある力を維持する」のが目的。Lower-Aより軽く・高回数（10〜12回）にして、腰や膝の負担を抑えつつ脚への刺激は残す。ここで重量を欲張ると、回復が間に合わず次のセッションに響く。",
          tip: "Lower-Aより-5〜10kg・高回数で「重量を維持」するのが狙い。今日はRDLが主役なので、ここは追い込みすぎない。"
        },
        {
          no: "03", name: "レッグプレス", tag: "脚・追い込み",
          sets: [
            { label: "M1–3", weight: "160〜170kg", reps: "10〜15回", rest: "rest 2 min" }
          ],
          why: "マシンなのでフォームが安定し、疲れていても安全に追い込める。RDL・スクワットで土台を使った後の「仕上げ」なので、10〜15回の中〜高回数で筋肉に最後の刺激と血流（パンプ）を入れる。フリーウェイトで限界まで攻めるとケガのリスクが上がる場面を、マシンが肩代わりしてくれる。",
          tip: "足の位置で効く場所が変わる。ハム・お尻を狙うなら足を少し高め・広めに。膝は伸ばしきらず、最後まで力を抜かない。"
        },
        {
          no: "04", name: "カーフレイズ（マシン）", tag: "ふくらはぎ",
          sets: [
            { label: "M1–3", weight: "60〜70kg", reps: "20回", rest: "rest 90 sec" }
          ],
          why: "ふくらはぎは日常の歩行で常に使われる持久的な筋肉なので、軽い負荷で少ない回数では刺激が足りない。だから20回という高回数で攻める。重量よりも「フルに伸ばして・縮める可動域」を稼ぐことが効かせるコツ。",
          tip: "一番下までかかとを落として伸ばし、一番上で1秒止める。可動域いっぱいに大きく動かすのがふくらはぎのコツ。"
        }
      ]
    }
  },

  /* 主要種目の伸び（開始→現在）。チャートは使わず「開始 → 現在（+増分）」で見せる。
     ★数値は要確認・トレ報告ごとに current を更新する。 */
  progress: [
    { lift: "スクワット",       start: 75, current: 75, unit: "kg" },
    { lift: "RDL",             start: 70, current: 70, unit: "kg" },
    { lift: "ベンチプレス",     start: 70, current: 70, unit: "kg" },
    { lift: "ショルダープレス", start: 54, current: 54, unit: "kg" }
  ],

  /* これまでのトレーニング記録（新しい順）。トレ報告のたびに先頭へ1行追加する。 */
  log: [
    {
      date: "2026-06-22", sessionKey: "upperB", minutes: 85,
      highlights: "ショルダー54×12・10・7／ペック54×12・12・11",
      detail: "マシンショルダープレス 54kg×12・10・7／ケーブルサイドレイズ 7〜9kg／EZバーカール 30kg×12・6 ＋ ライングエクステンション 20kg（三頭はプレスダウンから変更）／ペックデック 54kg×12・12・11／アイソラテラルハイロー 軽め",
      assessment: "ショルダーは12→10→7と落ちており、適正な追い込み。ペックは54kgで12・12・11と余裕があり＝次回プラスしてよい。三頭をライングエクステンションに変更して肘が固定しやすくなった。"
    },
    {
      date: "2026-06-19", sessionKey: "lowerA", minutes: 78,
      highlights: "スクワット75／RDL70（フォーム習得）",
      detail: "バーベルスクワット 75kg／RDL 70kg×8〜10（新導入・フォーム優先）／レッグプレス 153kg×12〜15／カーフレイズ 60kg×20　※回数の詳細は要確認",
      assessment: "RDL初導入の回。床まで下ろさず、お尻を引いてハムが伸びる感覚を最優先。スクワットは最優先種目として丁寧に。（実績の数値が分かれば更新します）"
    },
    {
      date: "2026-06-17", sessionKey: "upperA", minutes: 82,
      highlights: "ベンチ70×8・8・9／懸垂 自重×8・5・3",
      detail: "バーベルベンチプレス 70kg×8・8・9／懸垂 自重×8・5・3／インクラインマシンプレス 33.6kg×6・8・10／ラットプルダウン 77〜82kg　※ラットの数値は要確認",
      assessment: "ベンチはフォーム確認重視で70kg固定、安定。懸垂は後半失速＝まだ自重での継続が妥当。良い初回の滑り出し。"
    }
  ]
};
