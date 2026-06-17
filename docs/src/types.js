/* JSDoc 型定義（ビルドなし／tsc --noEmit 用）。実行時は何もしない。 */

/** @typedef {Object} WeightRec
 *  @property {string} id   日付(YYYY-MM-DD)
 *  @property {string} date
 *  @property {number} kg
 *  @property {number} [updatedAt] 保存時刻(ms) ＝LWWマージ用 */

/** @typedef {Object} InBodyRec
 *  @property {string} id   'ib-'+ts（ts一意）
 *  @property {string} ts   14桁 yyyymmddHHMMSS
 *  @property {string} date YYYY-MM-DD
 *  @property {string} [device]
 *  @property {number|null} [weight]
 *  @property {number|null} [smm]
 *  @property {number|null} [lean]
 *  @property {number|null} [fatMass]
 *  @property {number|null} [bodyFat]
 *  @property {number|null} [bmi]
 *  @property {number|null} [score]
 *  @property {number|null} [armR]
 *  @property {number|null} [armL]
 *  @property {number|null} [trunk]
 *  @property {number|null} [legR]
 *  @property {number|null} [legL]
 *  @property {number} [updatedAt] */

/** @typedef {Object} SetRec  @property {number} w  @property {number} reps */

/** @typedef {Object} Workout
 *  @property {string} id
 *  @property {string} date
 *  @property {string} ex
 *  @property {SetRec[]} sets
 *  @property {string} note
 *  @property {string[]} tags
 *  @property {number} [updatedAt] */

/** @typedef {Object} Regime
 *  @property {string} id
 *  @property {string} name
 *  @property {string} dose
 *  @property {string} start
 *  @property {number} [updatedAt] */

/** @typedef {Object} ExportBundle
 *  @property {number} version
 *  @property {string} exportedAt
 *  @property {WeightRec[]} weights
 *  @property {InBodyRec[]} inbody
 *  @property {Workout[]} workouts
 *  @property {Regime[]} regimes */

// ECharts は CDN グローバル。tsc から隔離するための any 宣言。
/** @typedef {any} EChartsInstance */
/* global echarts */

export {};
