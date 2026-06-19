/* 定数（色・目標・列マッピング）。色の意味固定 → ライム=筋肉, アンバー=脂肪 */
export const APP_VERSION = '1.1.0';           // ★ sw.js のキャッシュ名は gen-sw.js がここから注入

export const C = {
  lime:'#B6F500', amber:'#FFB020', cyan:'#3DD6D0', up:'#3FB950', down:'#F85149',
  text:'#E6EDF3', muted:'#8B98A5', border:'#232A34', surface:'#161B22', bg:'#0B0F14',
};
export const GOAL_KG = 94;          // 北極星（ガチムチ目標, 174cm換算 BMI31）
export const QUARTER_GAIN = 1.5;    // 四半期の中間目標 +1.5kg
export const DAY = 86400000;

export const TAGS = ['ストレートセット','ドロップセット','フルレンジ','可動域浅め','限界まで'];

// 列名 → 正準フィールド（列順に依存しない）。lean/bmi は将来用に保持（型にも定義）
export const COLMAP = {
  '日付':'ts','測定機器':'device','体重(kg)':'weight','骨格筋量(kg)':'smm','筋肉量(kg)':'lean',
  '体脂肪量(kg)':'fatMass','体脂肪率(%)':'bodyFat','BMI(kg/m²)':'bmi','InBody点数':'score',
  '右腕筋肉量(kg)':'armR','左腕筋肉量(kg)':'armL','体幹筋肉量(kg)':'trunk','右脚筋肉量(kg)':'legR','左脚筋肉量(kg)':'legL',
};
