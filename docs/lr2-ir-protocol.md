# LR2 IR (Internet Ranking) 通信プロトコル仕様書

## 調査ソース

- [OpenLR2](https://github.com/GOMazk/OpenLR2) — LR2 のオープンソース再実装（C++）
- [lr2oraja-lr2ir](https://github.com/wcko87/lr2oraja-lr2ir) — beatoraja 用 LR2IR 互換プラグイン（Java）
- [BMS-IR](https://www.bms-ir.org) — LR2IR 互換サーバー

---

## 1. 基本通信仕様

| 項目 | 値 |
| --- | --- |
| サーバーホスト | `www.dream-pro.info` |
| ベースパス | `/~lavalse/LR2IR/2/` |
| プロトコル | HTTP/1.0 |
| ポート | 80 |
| HTTP メソッド | POST（全エンドポイント） |
| Content-Type | `application/x-www-form-urlencoded`（暗黙的） |
| リクエスト文字コード | MS932 (Shift_JIS) で URL エンコード |
| レスポンス文字コード | CP932 (Shift_JIS) |
| タイムアウト | 15,000 ms |

### レスポンスペイロードの抽出

HTTP レスポンスボディ全体の中で最初の `#` 文字を検索し、それ以降をペイロードとして解釈する。

### HTTP リクエストの構造（OpenLR2 実装）

```
POST {path} HTTP/1.0\r\nContent-Length:{length}\n\n{body}
```

> Host ヘッダーは送信されない。ヘッダーと本文の区切りは `\r\n\r\n` ではなく `\n\n`。

---

## 2. エンドポイント一覧

| エンドポイント | パス | 用途 |
| --- | --- | --- |
| login.cgi | `/~lavalse/LR2IR/2/login.cgi` | ログイン / 新規登録 |
| score.cgi | `/~lavalse/LR2IR/2/score.cgi` | スコア送信 |
| getrankingxml.cgi | `/~lavalse/LR2IR/2/getrankingxml.cgi` | ランキング取得 |
| getplayerxml.cgi | `/~lavalse/LR2IR/2/getplayerxml.cgi` | ライバルデータ取得 |
| getghost.cgi | `/~lavalse/LR2IR/2/getghost.cgi` | ゴーストデータ取得 |
| getinsanelist.cgi | `/~lavalse/LR2IR/2/getinsanelist.cgi` | 発狂難度リスト取得 |

---

## 3. 各エンドポイントの詳細

### 3.1 login.cgi — ログイン / 新規登録

#### リクエストパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | int | LR2ID（0 の場合は新規登録） |
| `passmd5` | string | パスワードの MD5 ハッシュ（小文字 hex） |
| `name` | string | プレイヤー名（MS932 で URL エンコード） |
| `version` | int | 固定値 `100130` |

#### レスポンス

`#` 以降のテキストを先頭文字列でパースする。

| プレフィックス | 意味 | ID 抽出 |
| --- | --- | --- |
| `NEW ` + ID | 新規登録成功 | 4 文字目以降（例: `NEW 12345`） |
| `OK` + ID | ログイン成功 | 3 文字目以降（例: `OK12345`） |
| `B1` + ID | ログイン成功（混雑レベル 1: 自動更新 20 秒待ち） | 3 文字目以降 |
| `B2` + ID | ログイン成功（混雑レベル 2: 自動更新 30 秒待ち） | 3 文字目以降 |
| `B3` + ID | ログイン成功（混雑レベル 3: 自動更新無効） | 3 文字目以降 |
| `MAIL` | 無効なメールアドレス | — |
| `DB` | データベース接続エラー | — |
| `VERSION` | バージョンが古い | — |
| `BAN` | アカウント凍結 | — |
| `SORRY` | サーバーメンテナンス中 | — |
| `END` | サービス終了 | — |

`OK` / `B1` / `B2` / `B3` レスポンスにはカンマ区切りでライバル ID リストが含まれる:

```
OK12345,{unknown},{rival1_id},{rival2_id},...,{rival20_id}
```

CSV の `val[2]` 以降（最大 20 件）がライバル ID。

---

### 3.2 score.cgi — スコア送信

#### リクエストパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | int | LR2ID |
| `passmd5` | string | パスワードの MD5 ハッシュ |
| `songmd5` | string | 譜面ファイルの MD5 ハッシュ |
| `title` | string | 曲タイトル（MS932 URL エンコード） |
| `genre` | string | ジャンル（MS932 URL エンコード） |
| `artist` | string | アーティスト（MS932 URL エンコード） |
| `maxbpm` | int | 最大 BPM |
| `minbpm` | int | 最小 BPM |
| `playlevel` | int | 難易度レベル（コースの場合は `courseType`） |
| `clear` | int | クリアタイプ（0–5） |
| `exscore` | int | EX スコア（PG×2 + GR） |
| `pg` | int | PGREAT 数 |
| `gr` | int | GREAT 数 |
| `gd` | int | GOOD 数 |
| `bd` | int | BAD 数 |
| `pr` | int | POOR 数 |
| `maxcombo` | int | 最大コンボ数 |
| `playcount` | int | プレイ回数 |
| `clearcount` | int | クリア回数 |
| `rate` | int | 達成率（`exscore * 100 / (totalnotes * 2)`） |
| `minbp` | int | 最小ミスカウント（BAD + POOR + 未到達ノーツ） |
| `totalnotes` | int | 総ノーツ数 |
| `opt_history` | int | オプション履歴ビットフィールド |
| `opt_this` | int | 今回のオプション値 |
| `line` | int | キーモード（5, 7, 9, 10, 14） |
| `judge` | int | ジャッジ設定（BMS メタデータから） |
| `inputtype` | int | 入力デバイスタイプ |
| `ghost` | string | ゴーストデータ（圧縮済み文字列） |
| `rseed` | int | ランダムシード |
| `clear_db` | int | ダブルバトルモード最高クリア |
| `clear_ex` | int | エクストラモード最高クリア |
| `clear_sd` | int | SD モード最高クリア |
| `scorehash` | string | スコアハッシュ（改竄検出用） |

> **注意**: OpenLR2 のオリジナル実装では `minbpm` と `playlevel` の間に `&&`（二重アンパサンド）が存在する。これはバグだがサーバー側で受容されているため、互換性のために維持する必要がある。

#### scorehash 計算

```
scorehash = MD5(passMD5 + songMD5 + toString(exscore) + toString(clear))
```

4 つの文字列をそのまま連結して MD5 ハッシュを計算する（小文字 hex）。

#### レスポンス

成功時、続けて `getrankingxml.cgi` を呼び出してランキングを更新する。

---

### 3.3 getrankingxml.cgi — ランキング取得

#### リクエストパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `songmd5` | string | 譜面ファイルの MD5 ハッシュ |
| `id` | int | LR2ID |
| `lastupdate` | string | 最終更新タイムスタンプ（空文字列で全件取得） |

#### レスポンス

`#` 以降に XML（CP932 エンコーディング）:

```xml
<lastupdate>1234567890</lastupdate>
<ranking>
  <score>
    <name>PlayerName</name>
    <id>12345</id>
    <sp>100</sp>
    <dp>50</dp>
    <clear>4</clear>
    <notes>1000</notes>
    <combo>999</combo>
    <pg>800</pg>
    <gr>150</gr>
    <gd>30</gd>
    <bd>10</bd>
    <pr>10</pr>
    <minbp>20</minbp>
    <option>11</option>
    <comment>text</comment>
    <playcount>50</playcount>
  </score>
</ranking>
```

クライアント側では EX スコア（`pg*2 + gr`）で降順ソートし順位を計算する。

---

### 3.4 getplayerxml.cgi — ライバルデータ取得

#### リクエストパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | int | ライバルの LR2ID |
| `lastupdate` | int | 最終更新タイムスタンプ（0 で全件） |

#### レスポンス

`#` 以降に XML:

```xml
<rivalname>RivalPlayerName</rivalname>
<scorelist>
  <score>
    <hash>md5hash</hash>
    <clear>4</clear>
    <notes>1000</notes>
    <combo>999</combo>
    <pg>800</pg>
    <gr>150</gr>
    <gd>30</gd>
    <bd>10</bd>
    <pr>10</pr>
    <minbp>20</minbp>
    <option>11</option>
    <lastupdate>1234567890</lastupdate>
  </score>
</scorelist>
```

---

### 3.5 getghost.cgi — ゴーストデータ取得

#### リクエストパラメータ

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `songmd5` | string | 譜面ファイルの MD5 ハッシュ |
| `mode` | string | `"top"`（1 位）/ `"next"`（自分の次の順位）/ `"average"`（平均） |
| `playerid` | int | 自分の LR2ID |
| `targetid` | int | ターゲットプレイヤーの LR2ID |

#### レスポンス

`#` 以降にカンマ区切り CSV（CP932）:

```
{player_name},{exscore},{seed},{ghost_data}
```

| フィールド | インデックス | 型 | 説明 |
| --- | --- | --- | --- |
| プレイヤー名 | str[0] | string | プレイヤー名。`"NOPLAYER"` の場合はデータなし |
| EX スコア | val[1] | int | EX スコア |
| シード | val[2] | int | ランダムシード |
| ゴーストデータ | str[3] | string | 圧縮済みゴースト文字列 |

`mode=average` の場合はゴーストデータではなく EX スコアのみが返される。

---

### 3.6 getinsanelist.cgi — 発狂難度リスト取得

#### リクエストパラメータ

リクエストボディは空白（` `）のみ。

#### レスポンス

`#` 以降に XML:

```xml
<list>
  <song>
    <hash>md5hash</hash>
    <exlevel>12</exlevel>
  </song>
</list>
```

---

## 4. 認証フロー

```
┌──────────┐                          ┌──────────┐
│ LR2 Client│                         │ IR Server │
└─────┬────┘                          └─────┬────┘
      │                                      │
      │  1. パスワードの MD5 ハッシュを計算     │
      │     passMD5 = MD5(password)           │
      │                                      │
      │  2. POST login.cgi                    │
      │     id={LR2ID}&passmd5={passMD5}      │
      │     &name={name}&version=100130       │
      │ ──────────────────────────────────────>│
      │                                      │
      │  3. レスポンス: OK{id},{...rivals}     │
      │ <──────────────────────────────────── │
      │                                      │
      │  [ログイン完了、ライバルリスト取得]      │
      │                                      │
      │  4. POST score.cgi                    │
      │     id={LR2ID}&passmd5={passMD5}      │
      │     &scorehash={hash}&...             │
      │ ──────────────────────────────────────>│
      │                                      │
      │  5. POST getrankingxml.cgi            │
      │     songmd5={md5}&id={LR2ID}          │
      │ ──────────────────────────────────────>│
      │                                      │
      │  6. ランキング XML レスポンス          │
      │ <──────────────────────────────────── │
```

1. パスワードは設定ファイルに平文保存（`<irpass>password</irpass>`）
2. クライアント側で `MD5(password)` を計算し `passMD5` とする
3. ログイン時に `passMD5` と `id` を送信
4. スコア送信時の改竄検出: `scorehash = MD5(passMD5 + songMD5 + toString(exscore) + toString(clear))`

---

## 5. データ型定義

### 5.1 クリアタイプ（clear）

| 値 | 意味 | 条件 |
| --- | --- | --- |
| 0 | No Play | — |
| 1 | Failed | ゲージ不足 / 未完走 |
| 2 | Easy Clear | Easy ゲージ（hazard 以外）で 80% 以上 |
| 3 | Normal Clear | groove ゲージ（`gaugeType == 3`）で 80% 以上 |
| 4 | Hard Clear | hard / exhard / premium ゲージで完走（HP ≥ 2.0） |
| 5 | Full Combo | 全ノーツコンボ達成（`totalnotes == maxcombo`） |

### 5.2 キーモード（line）

| 値 | 意味 |
| --- | --- |
| 5 | 5 Keys |
| 7 | 7 Keys |
| 9 | 9 Keys (POP'N) |
| 10 | 10 Keys (DP 5K) |
| 14 | 14 Keys (DP 7K) |

### 5.3 opt_this（今回のオプション）

```
SP (keymode < 10): gauge + random[0] * 10
DP (keymode >= 10): gauge + random[0] * 10 + random[1] * 100 + dpflip * 1000
```

**ゲージ値**:
| 値 | 意味 |
| --- | --- |
| 0 | GROOVE |
| 1 | HARD |
| 2 | HAZARD |
| 3 | EASY |

**ランダム値**:
| 値 | 意味 |
| --- | --- |
| 0 | OFF |
| 1 | MIRROR |
| 2 | RANDOM |
| 3 | S-RANDOM |
| 5 | ALL-SCRATCH |

### 5.4 opt_history（オプション履歴ビットフィールド）

クリアタイプ 3 以上（Normal Clear 以上）の場合のみ記録される。

| ビット範囲 | 意味 | ビット値 |
| --- | --- | --- |
| bit 0–7 | ゲージタイプ | 0: `0x01`, 1: `0x02`, 2: `0x04`, 3: `0x08`, 4: `0x10`, 5: `0x20`, 6: `0x40`, 7: `0x80` |
| bit 8–15 | ランダム P1 | 0(OFF): `0x100`, 1(MIRROR): `0x200`, 2(RANDOM): `0x400`, 3(S-RANDOM): `0x800`, 5(ALLSCR): `0x2000` |
| bit 16–23 | HID/SUD | 0(OFF): `0x10000`, 1(HIDDEN): `0x20000`, 2(SUDDEN): `0x40000`, 3(HID+SUD): `0x80000` |
| bit 24 | アシストフラグ | `0x1000000` |

---

## 6. ゴーストデータ形式

ゴーストデータは各ノーツの判定結果をランレングス圧縮し、さらに二文字ペア置換で短縮した文字列。

### 6.1 ジャッジ値と文字のマッピング

| ジャッジ値 | 意味 | ベース文字 |
| --- | --- | --- |
| 0 | POOR（空） | `@` (0x40) |
| 1 | POOR / ミス | `A` (0x41) |
| 2 | BAD | `B` (0x42) |
| 3 | GOOD | `C` (0x43) |
| 4 | GREAT | `D` (0x44) |
| 5 | PGREAT | `E` (0x45) |

### 6.2 エンコード手順

**Stage 1: ランレングスエンコーディング**

同一ジャッジの連続を「文字 + 個数」で表現。1 回の場合は個数省略。終端記号 `ZZZ` を追加。

例: `EEEEEDDDCC` → `E5D3C2ZZZ`

**Stage 2: 二文字ペア置換（第 1 パス）**

| 元 | 置換 | | 元 | 置換 | | 元 | 置換 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | F | | D2 | S | | C2 | c |
| E2 | G | | D3 | T | | C3 | d |
| E3 | H | | D4 | U | | C4 | e |
| E4 | I | | D5 | V | | C5 | f |
| E5 | J | | D6 | W | | CE | g |
| E6 | K | | DE | X | | CD | h |
| E7 | L | | DC | Y | | CB | i |
| E8 | M | | DB | a | | CA | j |
| E9 | N | | DA | b | | AB | k |
| EC | P | | | | | AC | l |
| EB | Q | | | | | AD | m |
| EA | R | | | | | AE | n |
| | | | | | | A2 | o |
| | | | | | | A3 | p |

**Stage 3: X 系列ペア置換（第 2 パス）**

`X` は Stage 2 で `DE` → `X` の変換から生成される。

| 元 | 置換 |
| --- | --- |
| XX | q |
| X1 | r |
| X2 | s |
| X3 | t |
| X4 | u |
| X5 | v |
| X6 | w |
| X7 | x |
| X8 | y |
| X9 | z |

### 6.3 デコード手順

エンコードの逆順: Stage 3 逆変換 → Stage 2 逆変換 → ランレングス展開 → 各文字から `0x40` を引いてジャッジ値に変換。

---

## 7. HTTPS 対応の検討

### 現状

- LR2 オリジナルクライアントは HTTP/1.0 のみ対応（TLS 非対応）
- BMS-IR（`www.bms-ir.org`）は HTTPS で LR2IR 互換 API を提供
- lr2oraja（beatoraja 用プラグイン）は HTTPS 対応済み

### HTTPS 対応方法

1. **リバースプロキシ方式**: HTTPS 対応サーバー（Vercel 等）で受け、LR2 クライアントからは hosts ファイル書き換え + HTTP でアクセスさせる方法。ただし LR2 クライアントは HTTP/1.0 で直接接続するため、プロキシが必要。
2. **hosts ファイル + ローカルプロキシ**: `www.dream-pro.info` を `127.0.0.1` に向け、ローカルプロキシが HTTP → HTTPS 変換して互換サーバーに転送する方式。
3. **LR2 バイナリパッチ**: LR2 本体のホスト名文字列をパッチして互換サーバーの URL に書き換える方法。HTTPS 対応はクライアントが HTTP/1.0 固定のため不可。
4. **本プロジェクト（lr2ir-miuchi）のアプローチ**: Vercel 上に HTTPS で API を公開し、クライアント側は hosts ファイル書き換えまたはバイナリパッチで接続先を変更。HTTP/1.0 リクエストの受容については Vercel 側で対応可能か要検証。

### 推奨アプローチ

LR2 クライアントは HTTP/1.0 固定であるため、直接 HTTPS 接続は不可能。以下の二段構成を推奨:

- **サーバー側**: Vercel に HTTPS で API を公開（beatoraja / lr2oraja / Web ブラウザからの直接アクセス用）
- **LR2 クライアント用**: ユーザーのローカル環境にプロキシを設置するか、hosts ファイル書き換え + Vercel の HTTP→HTTPS リダイレクト機能を利用

> **TODO**: LR2 の HTTP/1.0 リクエストが Vercel Functions で正常に処理されるかの検証が必要。

---

## 8. 互換サーバー実装時の注意点

1. **文字コード**: リクエストは MS932 (Shift_JIS) で URL エンコードされている。レスポンスも CP932 で返す必要がある。
2. **`#` プレフィックス**: レスポンスボディの先頭に `#` を付与する（クライアントがこの文字を検索してペイロードを抽出するため）。
3. **XML の厳密性**: クライアントは単純な文字列マッチでタグを探すため、XML としての厳密な整形は不要だが、タグ名は正確に一致させる必要がある。
4. **`&&` バグの互換性**: `score.cgi` のパラメータ `minbpm` と `playlevel` の間に `&&` が入る可能性がある。サーバー側はこれを適切にパースする必要がある。
5. **ゲージ / ランダムの数値範囲**: `opt_this` フィールドの値域に注意。
6. **ランダムシード**: LR2 の `rseed` は `0–32766` の範囲（beatoraja は `0–16777215` と異なる）。
